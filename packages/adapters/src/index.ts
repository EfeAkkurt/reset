export * from "./types";

// Browser-compatible adapter
export { AdapterManager as AdapterManagerBrowser } from "./adapter-manager.browser";

// Server-side adapters
export { adapterManager, AdapterManager } from "./adapter-manager";

// Analytics engine for advanced calculations
export { AnalyticsEngine, analyticsEngine } from "./analytics/engine";

// Performance optimization utilities
export {
  PerformanceOptimizer,
  performanceOptimizer,
  memoize,
  createDataFetcher
} from "./utils/performance";

// Error handling utilities
export {
  ErrorHandler,
  errorHandler,
  ErrorType,
  ErrorSeverity,
  withErrorHandling,
  createSafeFunction
} from "./utils/error-handling";

// Cache services
// Cache services
export {
  CacheService,
  cacheService,
  CacheServiceServer,
  BackgroundSyncService,
  backgroundSyncService,
  CacheKeys,
  CACHE_PRESETS,
  CacheUtils,
} from "./cache";

export type {
  CacheStats,
  CacheConfig,
  SyncConfig,
  SyncStats,
} from "./cache";

// Risk management system
export {
  RiskManager,
  RiskMonitoringService,
  APIReliabilityManager,
  FinancialRiskAnalyzer,
  SecurityManager,
  createRiskManager,
  createStandaloneRiskAnalyzer,
  createStandaloneSecurityManager,
  calculateRiskScore,
  categorizeRisk,
  generateRiskRecommendations,
  type RiskManagementConfig,
  type SystemRiskData,
  type RiskMonitoringConfig,
  type DataAdapter,
  type DataAggregationStrategy,
  type SecurityConfig,
} from "./risk";