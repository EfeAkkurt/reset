// Browser-compatible cache service using memory storage
import {
  CacheEntry,
  VolumeCacheEntry,
  UserMetricsCacheEntry,
  AggregatedMetrics,
} from './schema';

export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  volumeEntries: number;
  userMetricsEntries: number;
  aggregatedEntries: number;
  averageTtl: number;
  hitRate: number;
}

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxEntries: number;
  cleanupInterval: number; // milliseconds
  enableStats: boolean;
}

interface MemoryCacheEntry {
  key: string;
  data: any;
  ttl: number;
  createdAt: number;
  expiresAt: number;
  updatedAt: number;
  lastAccessed: number;
  accessCount: number;
}

export class CacheService {
  private cache = new Map<string, MemoryCacheEntry>();
  private volumeCache = new Map<string, VolumeCacheEntry>();
  private userMetricsCache = new Map<string, UserMetricsCacheEntry>();
  private aggregatedMetricsCache = new Map<string, AggregatedMetrics>();
  private config: CacheConfig;
  private cleanupTimer?: number;
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000, // Reduced for memory
      cleanupInterval: 10 * 60 * 1000, // 10 minutes
      enableStats: true,
      ...config,
    };

    this.startCleanupTimer();
    console.log('✅ Memory cache initialized successfully');
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = window.setInterval(() => {
      this.runCleanup();
    }, this.config.cleanupInterval);

    console.log(`🕐 Cleanup timer started (interval: ${this.config.cleanupInterval}ms)`);
  }

  private runCleanup(): void {
    try {
      const now = Date.now();
      let cleaned = 0;

      // Clean main cache
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired entries`);
      }
    } catch (error) {
      console.error('❌ Failed to run cleanup:', error);
    }
  }

  // Generic cache operations
  async set(key: string, data: any, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);

    try {
      const entry: MemoryCacheEntry = {
        key,
        data,
        ttl: ttl || this.config.defaultTTL,
        createdAt: now,
        expiresAt,
        updatedAt: now,
        lastAccessed: now,
        accessCount: 1,
      };

      this.cache.set(key, entry);
      await this.pruneIfNeeded();
    } catch (error) {
      console.error(`❌ Failed to cache data for key "${key}":`, error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const now = Date.now();
      const entry = this.cache.get(key);

      if (entry && entry.expiresAt > now) {
        // Update access statistics
        entry.lastAccessed = now;
        entry.accessCount++;
        this.hits++;
        return JSON.parse(JSON.stringify(entry.data));
      }

      this.misses++;
      return null;
    } catch (error) {
      console.error(`❌ Failed to get cached data for key "${key}":`, error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return this.cache.delete(key);
    } catch (error) {
      console.error(`❌ Failed to delete cached data for key "${key}":`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.volumeCache.clear();
      this.userMetricsCache.clear();
      this.aggregatedMetricsCache.clear();
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  // Volume cache operations
  async setVolumeData(protocol: string, pool: string, data: {
    volume24h: number;
    volume7d: number;
    volume30d: number;
    concentrationRisk: number;
  }): Promise<void> {
    try {
      const now = Date.now();
      const key = `${protocol}:${pool}`;

      const entry: VolumeCacheEntry = {
        id: key,
        protocol,
        pool,
        volume24h: data.volume24h,
        volume7d: data.volume7d,
        volume30d: data.volume30d,
        concentrationRisk: data.concentrationRisk,
        timestamp: now,
        createdAt: now,
        updatedAt: now,
      };

      this.volumeCache.set(key, entry);
    } catch (error) {
      console.error(`❌ Failed to cache volume data for ${protocol}/${pool}:`, error);
      throw error;
    }
  }

  async getVolumeData(protocol: string, pool: string): Promise<VolumeCacheEntry | null> {
    try {
      const key = `${protocol}:${pool}`;
      return this.volumeCache.get(key) || null;
    } catch (error) {
      console.error(`❌ Failed to get volume data for ${protocol}/${pool}:`, error);
      return null;
    }
  }

  // User metrics cache operations
  async setUserMetrics(protocol: string, data: {
    uniqueUsers24h: number;
    uniqueUsers7d: number;
    uniqueUsers30d: number;
    activeWallets: number;
    newUsers: number;
    userRetention: number;
  }): Promise<void> {
    try {
      const now = Date.now();

      const entry: UserMetricsCacheEntry = {
        id: protocol,
        protocol,
        uniqueUsers24h: data.uniqueUsers24h,
        uniqueUsers7d: data.uniqueUsers7d,
        uniqueUsers30d: data.uniqueUsers30d,
        activeWallets: data.activeWallets,
        newUsers: data.newUsers,
        userRetention: data.userRetention,
        timestamp: now,
        createdAt: now,
        updatedAt: now,
      };

      this.userMetricsCache.set(protocol, entry);
    } catch (error) {
      console.error(`❌ Failed to cache user metrics for ${protocol}:`, error);
      throw error;
    }
  }

  async getUserMetrics(protocol: string): Promise<UserMetricsCacheEntry | null> {
    try {
      return this.userMetricsCache.get(protocol) || null;
    } catch (error) {
      console.error(`❌ Failed to get user metrics for ${protocol}:`, error);
      return null;
    }
  }

  // Aggregated metrics operations
  async setAggregatedMetrics(chain: string, data: {
    totalVolume24h: number;
    totalVolume7d: number;
    totalVolume30d: number;
    totalUsers24h: number;
    totalUsers7h: number;
    totalUsers30h: number;
    protocolCount: number;
  }): Promise<void> {
    try {
      const now = Date.now();

      const entry: AggregatedMetrics = {
        id: chain,
        chain,
        totalVolume24h: data.totalVolume24h,
        totalVolume7d: data.totalVolume7d,
        totalVolume30d: data.totalVolume30d,
        totalUsers24h: data.totalUsers24h,
        totalUsers7d: data.totalUsers7h,
        totalUsers30d: data.totalUsers30h,
        protocolCount: data.protocolCount,
        timestamp: now,
        createdAt: now,
        updatedAt: now,
      };

      this.aggregatedMetricsCache.set(chain, entry);
    } catch (error) {
      console.error(`❌ Failed to cache aggregated metrics for ${chain}:`, error);
      throw error;
    }
  }

  async getAggregatedMetrics(chain: string): Promise<AggregatedMetrics | null> {
    try {
      return this.aggregatedMetricsCache.get(chain) || null;
    } catch (error) {
      console.error(`❌ Failed to get aggregated metrics for ${chain}:`, error);
      return null;
    }
  }

  // Statistics
  async getStats(): Promise<CacheStats> {
    try {
      const now = Date.now();
      let expiredCount = 0;

      for (const entry of this.cache.values()) {
        if (entry.expiresAt < now) {
          expiredCount++;
        }
      }

      const total = this.hits + this.misses;

      return {
        totalEntries: this.cache.size,
        expiredEntries: expiredCount,
        volumeEntries: this.volumeCache.size,
        userMetricsEntries: this.userMetricsCache.size,
        aggregatedEntries: this.aggregatedMetricsCache.size,
        averageTtl: this.config.defaultTTL,
        hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      throw error;
    }
  }

  // Prune old entries if cache is full
  private async pruneIfNeeded(): Promise<void> {
    try {
      if (this.cache.size > this.config.maxEntries) {
        const entries = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

        const toDelete = entries.slice(0, Math.floor(this.config.maxEntries * 0.1));

        for (const [key] of toDelete) {
          this.cache.delete(key);
        }

        console.log(`🗑️ Pruned ${toDelete.length} old cache entries`);
      }
    } catch (error) {
      console.error('❌ Failed to prune cache:', error);
    }
  }

  // Cleanup
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cache.clear();
    this.volumeCache.clear();
    this.userMetricsCache.clear();
    this.aggregatedMetricsCache.clear();
    console.log('🔒 Memory cache closed');
  }
}

// Global instance
export const cacheService = new CacheService();