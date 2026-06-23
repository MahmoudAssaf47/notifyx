import { QueueProvider } from './types.js';
import { Queue, Worker, Job } from 'bullmq';
import { getCorrelationId, runWithCorrelation, createLogger } from '../telemetry.js';
import type { ConnectionOptions } from 'bullmq';

const logger = createLogger('RedisQueueProvider');

export class RedisQueueProvider implements QueueProvider {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private isPolling = false;
  private connectionConfig: ConnectionOptions;

  constructor(url: string) {
    this.connectionConfig = {
      url,
      maxRetriesPerRequest: null,
    };
  }

  private getQueue(topic: string): Queue {
    if (!this.queues.has(topic)) {
      const q = new Queue(topic, { connection: this.connectionConfig });
      this.queues.set(topic, q);
    }
    const q = this.queues.get(topic);
    if (q) return q;
    throw new Error(`Queue for topic ${topic} not found`);
  }

  public async publish(topic: string, payload: unknown, maxAttempts = 5): Promise<string> {
    const correlationId = getCorrelationId() ?? 'system';
    const queue = this.getQueue(topic);

    const job = await queue.add(topic, { payload, correlationId }, {
      attempts: maxAttempts,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    logger.debug(`Published event to topic: ${topic} via Redis`, { id: job.id });
    return job.id ?? '';
  }

  public subscribe(topic: string, handler: (payload: string) => Promise<void>): void {
    if (this.workers.has(topic)) {
      logger.warn(`Worker for topic ${topic} already exists`);
      return;
    }

    const worker = new Worker(topic, async (job: Job) => {
      const { payload, correlationId } = job.data;
      await runWithCorrelation(correlationId, async () => {
        const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
        await handler(payloadStr);
      });
    }, { connection: this.connectionConfig });

    worker.on('failed', (job, err) => {
      logger.error(`Job ID ${job?.id} failed on topic ${topic}`, { error: err.message });
    });

    if (!this.isPolling) {
      worker.pause();
    }

    this.workers.set(topic, worker);
    logger.info(`Subscribed handler to topic: ${topic} via Redis`);
  }

  public startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;
    for (const worker of this.workers.values()) {
      worker.resume();
    }
    logger.info('Event broker processing started (Redis)');
  }

  public stopPolling(): void {
    if (!this.isPolling) return;
    this.isPolling = false;
    for (const worker of this.workers.values()) {
      worker.pause();
    }
    logger.info('Event broker processing stopped (Redis)');
  }
}
