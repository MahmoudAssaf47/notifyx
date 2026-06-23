import { createLogger } from "../telemetry.js";
import { MemoryCacheProvider } from "./MemoryCacheProvider.js";
import { RedisCacheProvider } from "./RedisCacheProvider.js";
import { CacheProvider } from "./types.js";

export * from "./types.js";
export { MemoryCacheProvider, RedisCacheProvider };

const logger = createLogger("CacheManager");

let cacheProvider: CacheProvider;

export const initCacheProvider = (redisUrl?: string): CacheProvider => {
  if (cacheProvider) return cacheProvider;

  if (redisUrl) {
    try {
      cacheProvider = new RedisCacheProvider(redisUrl);
      logger.info("Cache Provider: Redis");
      return cacheProvider;
    } catch (err) {
      logger.warn(
        "Failed to initialize Redis cache provider, falling back to Memory cache",
        { error: err instanceof Error ? err.message : String(err) },
      );
    }
  }

  cacheProvider = new MemoryCacheProvider();
  logger.info("Cache Provider: Memory");
  return cacheProvider;
};

export const cache = initCacheProvider(process.env.REDIS_URL);
