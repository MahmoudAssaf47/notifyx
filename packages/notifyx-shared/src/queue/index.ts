import { createLogger } from "../telemetry.js";
import { MemoryQueueProvider } from "./MemoryQueueProvider.js";
import { RedisQueueProvider } from "./RedisQueueProvider.js";
import { QueueProvider } from "./types.js";

export * from "./types.js";
export { MemoryQueueProvider, RedisQueueProvider };

const logger = createLogger("QueueManager");

let queueProvider: QueueProvider;

export const initQueueProvider = (redisUrl?: string): QueueProvider => {
  if (queueProvider) return queueProvider;

  if (redisUrl) {
    try {
      queueProvider = new RedisQueueProvider(redisUrl);
      logger.info("Queue Provider: Redis");
      return queueProvider;
    } catch (err) {
      logger.warn(
        "Failed to initialize Redis queue provider, falling back to Memory queue",
        { error: err instanceof Error ? err.message : String(err) },
      );
    }
  }

  queueProvider = new MemoryQueueProvider();
  logger.info("Queue Provider: Memory");
  return queueProvider;
};

export const broker = initQueueProvider(process.env.REDIS_URL);
