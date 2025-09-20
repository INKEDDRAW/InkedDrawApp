/**
 * Cache Service
 * Advanced caching with performance optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  keyCount: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxMemory: string;
  evictionPolicy: string;
  compressionEnabled: boolean;
  serializationFormat: 'json' | 'msgpack';
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private stats: CacheStats = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    memoryUsage: 0,
    keyCount: 0,
  };

  private config: CacheConfig = {
    defaultTTL: 3600, // 1 hour
    maxMemory: '256mb',
    evictionPolicy: 'allkeys-lru',
    compressionEnabled: true,
    serializationFormat: 'json',
  };

  constructor(@InjectRedis() private readonly redis: Redis) {
    this.initializeCache();
    this.startStatsCollection();
  }

  /**
   * Initialize cache configuration
   */
  private async initializeCache(): Promise<void> {
    try {
      // Configure Redis for optimal performance
      await this.redis.config('SET', 'maxmemory', this.config.maxMemory);
      await this.redis.config('SET', 'maxmemory-policy', this.config.evictionPolicy);
      
      this.logger.log('Cache initialized with optimal configuration');
    } catch (error) {
      this.logger.error('Failed to initialize cache configuration:', error);
    }
  }

  /**
   * Start collecting cache statistics
   */
  private startStatsCollection(): void {
    setInterval(async () => {
      await this.updateStats();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Update cache statistics
   */
  private async updateStats(): Promise<void> {
    try {
      const info = await this.redis.info('stats');
      const memory = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');

      // Parse Redis info
      const statsLines = info.split('\r\n');
      const memoryLines = memory.split('\r\n');
      const keyspaceLines = keyspace.split('\r\n');

      // Extract hit/miss stats
      const hitsLine = statsLines.find(line => line.startsWith('keyspace_hits:'));
      const missesLine = statsLines.find(line => line.startsWith('keyspace_misses:'));
      
      if (hitsLine && missesLine) {
        const hits = parseInt(hitsLine.split(':')[1]);
        const misses = parseInt(missesLine.split(':')[1]);
        const total = hits + misses;

        this.stats.totalHits = hits;
        this.stats.totalMisses = misses;
        this.stats.totalRequests = total;
        this.stats.hitRate = total > 0 ? hits / total : 0;
        this.stats.missRate = total > 0 ? misses / total : 0;
      }

      // Extract memory usage
      const memoryLine = memoryLines.find(line => line.startsWith('used_memory:'));
      if (memoryLine) {
        this.stats.memoryUsage = parseInt(memoryLine.split(':')[1]);
      }

      // Extract key count
      const db0Line = keyspaceLines.find(line => line.startsWith('db0:'));
      if (db0Line) {
        const keysMatch = db0Line.match(/keys=(\d+)/);
        if (keysMatch) {
          this.stats.keyCount = parseInt(keysMatch[1]);
        }
      }
    } catch (error) {
      this.logger.error('Failed to update cache stats:', error);
    }
  }

  /**
   * Set cache value with optimizations
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = this.serialize(value);
      const compressedValue = this.config.compressionEnabled 
        ? await this.compress(serializedValue)
        : serializedValue;

      const cacheTTL = ttl || this.config.defaultTTL;
      
      if (cacheTTL > 0) {
        await this.redis.setex(key, cacheTTL, compressedValue);
      } else {
        await this.redis.set(key, compressedValue);
      }

      this.logger.debug(`Cache SET: ${key} (TTL: ${cacheTTL}s)`);
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get cache value with optimizations
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const compressedValue = await this.redis.get(key);
      
      if (compressedValue === null) {
        this.logger.debug(`Cache MISS: ${key}`);
        return null;
      }

      const serializedValue = this.config.compressionEnabled
        ? await this.decompress(compressedValue)
        : compressedValue;

      const value = this.deserialize<T>(serializedValue);
      
      this.logger.debug(`Cache HIT: ${key}`);
      return value;
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key existence ${key}:`, error);
      return false;
    }
  }

  /**
   * Set cache with pattern-based expiration
   */
  async setWithPattern(pattern: string, key: string, value: any, ttl?: number): Promise<void> {
    const fullKey = `${pattern}:${key}`;
    await this.set(fullKey, value, ttl);
  }

  /**
   * Get cache with pattern
   */
  async getWithPattern<T = any>(pattern: string, key: string): Promise<T | null> {
    const fullKey = `${pattern}:${key}`;
    return await this.get<T>(fullKey);
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${pattern}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Increment counter with expiration
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      
      if (value === 1 && ttl) {
        await this.redis.expire(key, ttl);
      }
      
      return value;
    } catch (error) {
      this.logger.error(`Failed to increment cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => {
        if (value === null) return null;
        
        try {
          const decompressed = this.config.compressionEnabled
            ? this.decompress(value)
            : value;
          return this.deserialize<T>(decompressed);
        } catch {
          return null;
        }
      });
    } catch (error) {
      this.logger.error('Failed to get multiple cache keys:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serialized = this.serialize(value);
        const compressed = this.config.compressionEnabled
          ? await this.compress(serialized)
          : serialized;
        
        if (ttl) {
          pipeline.setex(key, ttl, compressed);
        } else {
          pipeline.set(key, compressed);
        }
      }
      
      await pipeline.exec();
      this.logger.debug(`Cache MSET: ${Object.keys(keyValuePairs).length} keys`);
    } catch (error) {
      this.logger.error('Failed to set multiple cache keys:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    return this.stats.hitRate;
  }

  /**
   * Flush all cache
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.warn('Cache flushed - all keys deleted');
    } catch (error) {
      this.logger.error('Failed to flush cache:', error);
    }
  }

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<void> {
    try {
      // Remove expired keys
      await this.redis.eval(`
        local keys = redis.call('keys', '*')
        local expired = 0
        for i=1,#keys do
          if redis.call('ttl', keys[i]) == -1 then
            redis.call('del', keys[i])
            expired = expired + 1
          end
        end
        return expired
      `, 0);

      // Update configuration for better performance
      await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
      
      this.logger.log('Cache optimization completed');
    } catch (error) {
      this.logger.error('Failed to optimize cache:', error);
    }
  }

  /**
   * Serialize value
   */
  private serialize(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      this.logger.error('Failed to serialize value:', error);
      throw error;
    }
  }

  /**
   * Deserialize value
   */
  private deserialize<T>(value: string): T {
    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('Failed to deserialize value:', error);
      throw error;
    }
  }

  /**
   * Compress value (placeholder for actual compression)
   */
  private async compress(value: string): Promise<string> {
    // In a real implementation, you would use a compression library like zlib
    return value;
  }

  /**
   * Decompress value (placeholder for actual decompression)
   */
  private async decompress(value: string): Promise<string> {
    // In a real implementation, you would use a compression library like zlib
    return value;
  }
}
