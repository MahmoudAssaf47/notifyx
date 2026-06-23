import { randomUUID } from "crypto";
import {
  createLogger,
  getCorrelationId,
  runWithCorrelation,
} from "../telemetry.js";
import { QueueProvider } from "./types.js";

const logger = createLogger("MemoryQueueProvider");

export class MemoryQueueProvider implements QueueProvider {
  private handlers: Map<string, Array<(payload: string) => Promise<void>>> =
    new Map();
  private isPolling = false;
  private pendingJobs: Array<{
    id: string;
    topic: string;
    payload: unknown;
    correlationId: string;
    attempts: number;
    maxAttempts: number;
  }> = [];
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {}

  public async publish(
    topic: string,
    payload: unknown,
    maxAttempts = 5,
  ): Promise<string> {
    const correlationId = getCorrelationId() ?? "system";
    const id = randomUUID();

    this.pendingJobs.push({
      id,
      topic,
      payload,
      correlationId,
      attempts: 0,
      maxAttempts,
    });

    logger.debug(`Published event to topic: ${topic} via MemoryQueue`, { id });
    return id;
  }

  public subscribe(
    topic: string,
    handler: (payload: string) => Promise<void>,
  ): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    const topicHandlers = this.handlers.get(topic);
    if (topicHandlers) topicHandlers.push(handler);
    logger.info(`Subscribed handler to topic: ${topic} via MemoryQueue`);
  }

  public startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    this.pollInterval = setInterval(() => this.processJobs(), 500);
    logger.info("Event broker processing started (MemoryQueue)");
  }

  public stopPolling(): void {
    if (!this.isPolling) return;
    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    logger.info("Event broker processing stopped (MemoryQueue)");
  }

  private async processJobs() {
    if (!this.isPolling || this.pendingJobs.length === 0) return;

    const batch = this.pendingJobs.splice(0, 10);

    for (const job of batch) {
      const topicHandlers = this.handlers.get(job.topic) || [];

      if (topicHandlers.length === 0) {
        this.pendingJobs.push(job);
        continue;
      }

      for (const handler of topicHandlers) {
        try {
          await runWithCorrelation(job.correlationId, async () => {
            const payloadStr =
              typeof job.payload === "string"
                ? job.payload
                : JSON.stringify(job.payload);
            await handler(payloadStr);
          });
        } catch (error) {
          job.attempts++;
          logger.error(`Job failed on topic ${job.topic}`, {
            error: error instanceof Error ? error.message : String(error),
          });

          if (job.attempts < job.maxAttempts) {
            this.pendingJobs.push(job);
          } else {
            logger.error(
              `Job dead lettered on topic ${job.topic} after ${job.maxAttempts} attempts`,
            );
          }
        }
      }
    }
  }
}
