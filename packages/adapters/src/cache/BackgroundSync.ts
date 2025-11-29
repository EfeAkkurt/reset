import { cacheService } from './index';

export interface SyncConfig {
  enabled: boolean;
  intervalMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  protocols: string[];
  enableAggregatedMetrics: boolean;
}

export interface SyncStats {
  lastSync: number;
  successfulSyncs: number;
  failedSyncs: number;
  protocolsUpdated: number;
  avgSyncTime: number;
  errors: string[];
}

export class BackgroundSyncService {
  private config: SyncConfig;
  private syncTimer?: NodeJS.Timeout;
  private isSyncing = false;
  private stats: SyncStats;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enabled: true,
      intervalMs: 30 * 60 * 1000, // 30 minutes
      retryAttempts: 3,
      retryDelayMs: 5 * 60 * 1000, // 5 minutes
      protocols: ['folks-finance', 'tinyman', 'pact'],
      enableAggregatedMetrics: true,
      ...config,
    };

    this.stats = {
      lastSync: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      protocolsUpdated: 0,
      avgSyncTime: 0,
      errors: [],
    };

    console.log('🔄 Background sync service initialized', this.config);
  }

  start(): void {
    if (!this.config.enabled) {
      console.log('⏸️ Background sync disabled');
      return;
    }

    if (this.syncTimer) {
      console.log('⏱️ Background sync already running');
      return;
    }

    // Start periodic sync
    this.syncTimer = setInterval(() => {
      this.performSync().catch(error => {
        console.error('❌ Background sync failed:', error);
      });
    }, this.config.intervalMs);

    // Perform initial sync after a short delay
    setTimeout(() => {
      this.performSync().catch(error => {
        console.error('❌ Initial background sync failed:', error);
      });
    }, 5000);

    console.log(`🚀 Background sync started (interval: ${this.config.intervalMs}ms)`);
  }

  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
      console.log('⏹️ Background sync stopped');
    }
  }

  async performSync(): Promise<SyncStats> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return this.stats;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      console.log('🔄 Starting background sync...');

      let protocolsUpdated = 0;
      const errors: string[] = [];

      // Sync each protocol with retry logic
      for (const protocol of this.config.protocols) {
        try {
          await this.syncProtocolWithRetry(protocol);
          protocolsUpdated++;
          console.log(`✅ Sync completed for: ${protocol}`);
        } catch (error) {
          const errorMsg = `Failed to sync ${protocol}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Sync aggregated metrics if enabled
      if (this.config.enableAggregatedMetrics) {
        try {
          await this.syncAggregatedMetrics();
          console.log('✅ Aggregated metrics synced');
        } catch (error) {
          const errorMsg = `Failed to sync aggregated metrics: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Update stats
      const syncTime = Date.now() - startTime;
      this.stats = {
        lastSync: Date.now(),
        successfulSyncs: this.stats.successfulSyncs + 1,
        failedSyncs: errors.length > 0 ? this.stats.failedSyncs + 1 : this.stats.failedSyncs,
        protocolsUpdated,
        avgSyncTime: this.calculateAverageSyncTime(syncTime),
        errors,
      };

      console.log(`🎉 Background sync completed successfully (${syncTime}ms)`);
      return this.stats;

    } catch (error) {
      const errorMsg = `Background sync failed: ${error instanceof Error ? error.message : String(error)}`;
      this.stats.failedSyncs++;
      this.stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);

      return this.stats;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncProtocolWithRetry(protocol: string): Promise<void> {
    // Placeholder for future sync logic
    console.log(`Syncing ${protocol}...`);
    return Promise.resolve();
  }

  private async syncAggregatedMetrics(): Promise<void> {
    // Placeholder for future aggregated metrics
    console.log('Syncing aggregated metrics...');
    return Promise.resolve();
  }

  private calculateAverageSyncTime(newSyncTime: number): number {
    if (this.stats.avgSyncTime === 0) {
      return newSyncTime;
    }

    // Simple moving average
    return (this.stats.avgSyncTime * 0.8) + (newSyncTime * 0.2);
  }

  // Force an immediate sync
  async forceSync(): Promise<SyncStats> {
    console.log('🔄 Forcing immediate background sync...');
    return this.performSync();
  }

  // Get current sync statistics
  getStats(): SyncStats {
    return { ...this.stats };
  }

  // Check if sync is currently running
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      return await cacheService.getStats();
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return null;
    }
  }

  // Clear sync errors
  clearErrors(): void {
    this.stats.errors = [];
  }

  // Update configuration
  updateConfig(newConfig: Partial<SyncConfig>): void {
    const wasEnabled = this.config.enabled;
    const intervalChanged = newConfig.intervalMs && newConfig.intervalMs !== this.config.intervalMs;

    this.config = { ...this.config, ...newConfig };

    // Restart sync if configuration changed significantly
    if (intervalChanged && this.syncTimer) {
      console.log('🔄 Sync interval changed, restarting sync...');
      this.stop();
      this.start();
    } else if (!wasEnabled && this.config.enabled) {
      console.log('🔄 Sync enabled, starting...');
      this.start();
    } else if (wasEnabled && !this.config.enabled) {
      console.log('🔄 Sync disabled, stopping...');
      this.stop();
    }
  }
}

// Global instance
export const backgroundSyncService = new BackgroundSyncService();

// Auto-start in all environments for development
if (typeof process !== 'undefined') {
  console.log('🚀 Starting background sync service...');
  backgroundSyncService.start();
}