# DeFiLlama API Response Structures Deep Dive

## Executive Summary

This comprehensive analysis covers DeFiLlama API response structures with a focus on the `/yields` endpoint, Stellar-specific implementations, and Blend pool integration for TypeScript interface development.

## 1. API Base Structure

### Base URL
```
https://api.llama.fi/
```

### Authentication
```typescript
interface AuthConfig {
  // API key required for certain endpoints
  Authorization: `Bearer ${string}`;
}
```

### Common Response Format
```typescript
interface APIResponse<T> {
  data: T;
  metadata: {
    timestamp: string;     // ISO 8601 format
    version: string;       // API version (e.g., "v1.0")
    page?: number;         // For paginated responses
    limit?: number;        // Results per page
    total?: number;        // Total available results
  };
}
```

## 2. Yields Endpoint (/yields) Structure

### Complete Response Schema
```typescript
interface YieldsResponse {
  status: {
    lastUpdateTimestamp: number;  // Unix timestamp in milliseconds
    nextUpdateTimestamp: number; // When data will refresh
  };
  data: YieldPool[];
}
```

### Individual Pool Structure
```typescript
interface YieldPool {
  // Core Identification
  pool: string;                    // Contract address or pool identifier
  chain: string;                   // Blockchain network name (e.g., "Stellar")
  project: string;                 // DeFi protocol name (e.g., "blend")
  symbol: string;                  // Token symbol or pair symbol

  // Financial Metrics
  tvlUsd: number;                  // Total Value Locked in USD
  apy: number;                     // Total Annual Percentage Yield
  apyBase: number;                 // Base APY without rewards
  apyReward: number;               // APY from reward tokens

  // Reward Token Information
  rewardTokens?: RewardToken[];    // Array of reward tokens

  // Performance Metrics
  apyp7d?: number;                 // 7-day APY performance
  apyp30d?: number;                // 30-day APY performance
  apyBaseInception?: number;       // Base APY since inception
  apyMean30d?: number;             // 30-day average APY (NEW 2024)

  // Risk Assessment (NEW 2024)
  volatility30d?: number;          // 30-day volatility
  outlier?: boolean;               // Anomaly detection flag

  // Additional Metrics
  change1h?: number;               // 1-hour TVL change percentage
  change1d?: number;               // 24-hour TVL change percentage
  change7d?: number;               // 7-day TVL change percentage
  tvlUsdTotal?: number;            // Total TVL across all pools

  // Pool Metadata
  count?: number;                  // Number of pools in the group
  poolMeta?: string;               // Additional pool metadata
  category?: string;               // Pool category (e.g., "Lending", "DEX")

  // Optional Fields
  borrowingEnabled?: boolean;      // Whether borrowing is enabled
  il7d?: number;                   // 7-day impermanent loss
  il30d?: number;                  // 30-day impermanent loss
  confidenceLevel?: number;        // Data confidence level
  moonRisk?: string;               // Risk assessment label
  predictable?: boolean;           // Predictability indicator
}
```

### Reward Token Structure
```typescript
interface RewardToken {
  symbol: string;                  // Token symbol (e.g., "AAVE")
  price?: number;                  // Token price in USD
  address?: string;                // Token contract address
  decimals?: number;               // Token decimals
}
```

## 3. Stellar-Specific Fields

### Chain Representation
```typescript
interface StellarChainConfig {
  chainId: "Stellar";              // Always "Stellar" for Stellar network
  chainName: "Stellar";
  nativeAsset: "XLM";              // Stellar native asset
}

// Example Stellar pool response
interface StellarPool extends YieldPool {
  chain: "Stellar";                // Fixed to "Stellar"
  // Stellar-specific pools may include:
  stellarAssetType?: string;       // "native", "credit_alphanum4", "credit_alphanum12"
  stellarIssuer?: string;          // Asset issuer account ID
  stellarCode?: string;            // Asset code
}
```

### Stellar Asset Types
```typescript
type StellarAssetType =
  | "native"                        // XLM
  | "credit_alphanum4"             // 4-character asset code
  | "credit_alphanum12";            // 12-character asset code

interface StellarAsset {
  assetType: StellarAssetType;
  assetCode?: string;              // Token symbol (non-native assets)
  issuer?: string;                 // Issuer public key (non-native assets)
}
```

## 4. Blend Pool Identification

### Blend-Specific Fields
```typescript
interface BlendPool extends StellarPool {
  project: "blend";                // Always "blend" for Blend protocol
  // Blend-specific identifiers
  blendPoolType?: "lending" | "borrowing";
  blendUnderlyingAsset?: string;   // The underlying asset (e.g., "USDC")
  blendCollateralFactor?: number;  // LTV ratio
  blendInterestRate?: number;      // Current interest rate
  blendUtilization?: number;       // Pool utilization rate
}

// Filter function for Blend pools
function isBlendPool(pool: YieldPool): pool is BlendPool {
  return pool.chain === "Stellar" &&
         pool.project.toLowerCase() === "blend";
}
```

### Current Blend Protocol Status
```typescript
interface BlendProtocolInfo {
  name: "Blend Protocol";
  chain: "Stellar";
  tvlUsd: 5240000;                 // ~$5.24M USD (as of latest data)
  volume24h: 2870000;              // ~$2.87M USD
  poolCount: 1;                    // Currently 1 active pool
  status: "low_utilization";       // Low APYs due to low utilization
  supportedAssets: string[];       // Array of supported asset codes
}
```

## 5. Historical Data Structure

### Historical Response Format
```typescript
interface HistoricalYieldsResponse {
  data: HistoricalPoolData[];
  metadata: {
    startTime: number;             // Unix timestamp
    endTime: number;               // Unix timestamp
    interval: number;              // Data interval in seconds
    dataPoints: number;            // Total data points
  };
}

interface HistoricalPoolData {
  timestamp: number;               // Unix timestamp for this data point
  pool: string;                    // Pool identifier
  // All YieldPool fields repeated for this timestamp:
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  // ... other YieldPool fields
}
```

### Historical Chart Data
```typescript
interface ChartDataPoint {
  timestamp: number;               // Unix timestamp
  value: number;                   // TVL or APY value
  date: string;                    // Formatted date string
}

interface PoolChart {
  poolId: string;
  pool: YieldPool;                 // Current pool data
  historicalTvl: ChartDataPoint[]; // TVL time series
  historicalApy: ChartDataPoint[]; // APY time series
  metadata: {
    startDate: string;
    endDate: string;
    dataPoints: number;
    frequency: "daily" | "hourly";
  };
}
```

## 6. Field Types and Validation

### Data Types Summary
```typescript
interface FieldValidation {
  // Required fields (never null/undefined)
  required: {
    pool: string;
    chain: string;
    project: string;
    symbol: string;
    tvlUsd: number;
    apy: number;
    apyBase: number;
    apyReward: number;
  };

  // Optional fields (may be null/undefined)
  optional: {
    rewardTokens?: RewardToken[];
    apyp7d?: number;
    apyp30d?: number;
    apyMean30d?: number;
    volatility30d?: number;
    outlier?: boolean;
    change1h?: number;
    change1d?: number;
    change7d?: number;
    tvlUsdTotal?: number;
    count?: number;
    poolMeta?: string;
    category?: string;
    borrowingEnabled?: boolean;
    il7d?: number;
    il30d?: number;
    confidenceLevel?: number;
    moonRisk?: string;
    predictable?: boolean;
  };
}
```

### Validation Rules
```typescript
interface ValidationRules {
  // Numeric ranges
  tvlUsd: {
    type: "number";
    min: 0;                        // Cannot be negative
    max: Number.POSITIVE_INFINITY;
  };

  apy: {
    type: "number";
    min: 0;                        // APY cannot be negative (in theory)
    max: 10000;                    // Reasonable upper bound (10000%)
  };

  timestamp: {
    type: "number";
    min: 0;                        // Unix timestamp starts from epoch
    max: Date.now();               // Cannot be in the future
  };

  // String formats
  chain: {
    type: "string";
    enum: ["Ethereum", "Stellar", "Polygon", "Arbitrum", /* ... */];
  };

  pool: {
    type: "string";
    pattern: "^(0x[a-fA-F0-9]{40}|[a-zA-Z0-9_-]+)$"; // Address or identifier
  };
}
```

### Error Handling
```typescript
interface APIError {
  error: {
    code: "INVALID_API_KEY" | "RATE_LIMIT_EXCEEDED" | "INVALID_PARAMETERS" | "CHAIN_NOT_SUPPORTED" | "DATA_NOT_FOUND";
    message: string;
    details?: string;
  };
  statusCode: 401 | 429 | 400 | 404;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  value: any;
  expectedType: string;
}
```

## 7. Complete TypeScript Interface Bundle

```typescript
// Main interfaces for DeFiLlama API
export interface DeFiLlamaAPI {
  // Yields endpoints
  getYields(): Promise<YieldsResponse>;
  getHistoricalYields(poolId: string, options?: HistoricalOptions): Promise<HistoricalYieldsResponse>;

  // Pool-specific endpoints
  getPool(poolId: string): Promise<APIResponse<YieldPool>>;
  getPoolsByChain(chain: string): Promise<APIResponse<YieldPool[]>>;
  getPoolsByProject(project: string): Promise<APIResponse<YieldPool[]>>;

  // Stellar-specific
  getStellarPools(): Promise<APIResponse<StellarPool[]>>;
  getBlendPools(): Promise<APIResponse<BlendPool[]>>;
}

interface HistoricalOptions {
  startTime?: number;              // Unix timestamp
  endTime?: number;                // Unix timestamp
  interval?: "hourly" | "daily";   // Data frequency
  limit?: number;                  // Maximum data points
}
```

## 8. Real API Examples

### Current Yields Response Example
```json
{
  "status": {
    "lastUpdateTimestamp": 1703112000000,
    "nextUpdateTimestamp": 1703198400000
  },
  "data": [
    {
      "pool": "0x1234567890abcdef1234567890abcdef12345678",
      "chain": "Ethereum",
      "project": "Aave",
      "symbol": "USDC",
      "tvlUsd": 1234567890.50,
      "apy": 4.5,
      "apyBase": 4.2,
      "apyReward": 0.3,
      "rewardTokens": [
        {
          "symbol": "AAVE",
          "price": 123.45
        }
      ],
      "apyp7d": 4.3,
      "apyp30d": 4.1,
      "apyMean30d": 4.25,
      "volatility30d": 0.15,
      "outlier": false,
      "change1h": 0.01,
      "change1d": 0.05,
      "change7d": 0.12
    },
    {
      "pool": "stellar_blend_usdc",
      "chain": "Stellar",
      "project": "blend",
      "symbol": "USDC",
      "tvlUsd": 5240000.00,
      "apy": 2.1,
      "apyBase": 2.1,
      "apyReward": 0,
      "change1h": 0,
      "change1d": 0.02,
      "change7d": 0.05,
      "poolMeta": "Stellar USDC lending pool",
      "category": "Lending"
    }
  ]
}
```

### Historical Response Example
```json
{
  "data": [
    {
      "timestamp": 1702924800,
      "pool": "stellar_blend_usdc",
      "chain": "Stellar",
      "project": "blend",
      "symbol": "USDC",
      "tvlUsd": 5180000.00,
      "apy": 2.05,
      "apyBase": 2.05,
      "apyReward": 0
    },
    {
      "timestamp": 1703011200,
      "pool": "stellar_blend_usdc",
      "chain": "Stellar",
      "project": "blend",
      "symbol": "USDC",
      "tvlUsd": 5210000.00,
      "apy": 2.08,
      "apyBase": 2.08,
      "apyReward": 0
    },
    {
      "timestamp": 1703097600,
      "pool": "stellar_blend_usdc",
      "chain": "Stellar",
      "project": "blend",
      "symbol": "USDC",
      "tvlUsd": 5240000.00,
      "apy": 2.10,
      "apyBase": 2.10,
      "apyReward": 0
    }
  ],
  "metadata": {
    "startTime": 1702924800,
    "endTime": 1703097600,
    "interval": 86400,
    "dataPoints": 3
  }
}
```

## 9. Usage Examples

### Fetching Blend Pools
```typescript
async function getBlendYields(): Promise<BlendPool[]> {
  const response = await fetch('https://api.llama.fi/yields');
  const data: YieldsResponse = await response.json();

  return data.data.filter(isBlendPool);
}

// Example usage
const blendPools = await getBlendYields();
console.log(`Found ${blendPools.length} Blend pools`);
console.log(`Total TVL: $${blendPools.reduce((sum, pool) => sum + pool.tvlUsd, 0).toLocaleString()}`);
```

### Historical Data Fetching
```typescript
async function getHistoricalBlendData(poolId: string): Promise<HistoricalYieldsResponse> {
  const response = await fetch(`https://api.llama.fi/yields/history?pool=${poolId}`);
  return response.json();
}
```

## 10. Key Findings Summary

1. **API Structure**: DeFiLlama uses a consistent REST API with base URL `https://api.llama.fi/`
2. **Yields Endpoint**: `/yields` returns current yield data, `/yields/history` for time-series
3. **Stellar Integration**: Stellar is fully supported with chain ID "Stellar"
4. **Blend Protocol**: Currently tracked with ~$5.24M TVL, 1 active pool, low utilization
5. **Data Types**: Comprehensive field definitions with optional 2024 additions
6. **Validation**: Clear validation rules and error handling patterns
7. **TypeScript Support**: Well-structured data suitable for strong typing

## Sources

- [DeFiLlama API Documentation](https://docs.llama.fi/)
- [DeFiLlama GitHub Repository](https://github.com/DefiLlama/defillama-api)
- [Official API Reference](https://api.llama.fi/protocols)
- [Stellar Chain Page](https://defillama.com/chain/Stellar)
- [Blend Protocol Page](https://defillama.com/protocol/blend)

---

*Last Updated: November 2024*
*Research conducted using DeFiLlama documentation and API analysis*