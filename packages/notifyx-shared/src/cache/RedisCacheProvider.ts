import { Redis } from 'ioredis';
import { CacheProvider } from './types.js';
import { createLogger } from '../telemetry.js';

const logger = createLogger('RedisCacheProvider');

export class RedisCacheProvider implements CacheProvider {
  private redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url, { maxRetriesPerRequest: null });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error(`Redis get error for key ${key}`, { error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.error(`Redis set error for key ${key}`, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      logger.error(`Redis del error for key ${key}`, { error: err instanceof Error ? err.message : String(err) });
    }
  }
}
