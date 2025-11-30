# Stellar DeFi Insurance SDK

A comprehensive TypeScript SDK for interacting with the Stellar DeFi Insurance smart contracts.

## Features

- 🚀 **Type-safe** contract interactions
- 📦 **All-in-one** SDK for insurance, yield farming, and treasury management
- 🔒 **Multi-signature** treasury support
- 🌐 **Multi-network** support (mainnet, testnet, futurenet)
- 🔄 **Transaction simulation** and retry logic
- 🛡️ **Comprehensive error handling**
- 📝 **Full TypeScript support**

## Installation

```bash
npm install @stellar-defi-insurance/sdk
```

## Quick Start

```typescript
import { StellarDeFiInsuranceSDK } from '@stellar-defi-insurance/sdk';

// Initialize SDK for testnet
const sdk = StellarDeFiInsuranceSDK.forNetwork('testnet')(
  [
    { type: 'simpleInsurance', address: 'CONTRACT_ADDRESS_HERE' },
    { type: 'yieldAggregator', address: 'YIELD_AGGREGATOR_ADDRESS' },
    { type: 'treasury', address: 'TREASURY_ADDRESS' }
  ]
);

// Connect your wallet
await sdk.connectWallet({
  secretKey: 'YOUR_SECRET_KEY' // or use publicKey with external signing
});

// Create an insurance policy
const policyResult = await sdk.getSimpleInsurance()?.createPolicy({
  holder: 'GDESTINATION_ADDRESS_HERE',
  coverageAmount: '1000',
  premiumAmount: '50',
  duration: 30 * 24 * 60 * 60, // 30 days
  riskLevel: 'LOW'
});

if (policyResult.success) {
  console.log('Policy created:', policyResult.result);
} else {
  console.error('Policy creation failed:', policyResult.error);
}
```

## Available Contracts

### Simple Insurance

Create and manage insurance policies:

```typescript
const insurance = sdk.getSimpleInsurance();

// Create a policy
await insurance.createPolicy({
  holder: 'GDESTINATION_ADDRESS',
  coverageAmount: '1000',
  premiumAmount: '50',
  duration: 2592000, // 30 days in seconds
  riskLevel: 'LOW'
});

// Get policy details
const policy = await insurance.getPolicy('POLICY_ID');

// File a claim
await insurance.fileClaim('POLICY_ID', {
  claimant: 'GCLAIMANT_ADDRESS',
  amount: '500',
  reason: 'Claim reason',
  evidence: ['evidence1', 'evidence2']
});
```

### Yield Aggregator

Manage yield farming positions:

```typescript
const yieldAgg = sdk.getYieldAggregator();

// Get available pools
const pools = await yieldAgg.getPoolInfos();

// Deposit funds
await yieldAgg.deposit({
  user: 'GUSER_ADDRESS',
  amount: '1000',
  poolId: 'pool-id-here'
});

// Withdraw funds
await yieldAgg.withdraw({
  user: 'GUSER_ADDRESS',
  amount: '500',
  poolId: 'pool-id-here'
});

// Claim rewards
await yieldAgg.claimRewards('GUSER_ADDRESS');
```

### Treasury

Multi-signature fund management:

```typescript
const treasury = sdk.getTreasury();

// Create transaction requiring multiple signatures
await treasury.createTransaction({
  to: 'GDESTINATION_ADDRESS',
  amount: '1000',
  reason: 'Payment to vendor',
  requiredSignatures: 3
});

// Sign transaction
await treasury.signTransaction('TX_ID', 'GSIGNER_ADDRESS');

// Execute approved transaction
await treasury.executeTransaction('TX_ID');
```

## Network Support

The SDK supports multiple Stellar networks:

```typescript
// Testnet
const testnetSDK = StellarDeFiInsuranceSDK.forNetwork('testnet')(contracts);

// Mainnet
const mainnetSDK = StellarDeFiInsuranceSDK.forNetwork('mainnet')(contracts);

// Futurenet
const futurenetSDK = StellarDeFiInsuranceSDK.forNetwork('futurenet')(contracts);
```

## Wallet Integration

### With Secret Key

```typescript
await sdk.connectWallet({
  secretKey: 'YOUR_SECRET_KEY'
});
```

### With External Signing

```typescript
await sdk.connectWallet({
  publicKey: 'GPUBLIC_KEY',
  signTransaction: async (tx) => {
    // Your custom signing logic
    return signedTransaction;
  }
});
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
import {
  ContractError,
  NetworkError,
  ValidationError,
  isStellarDeFiInsuranceError
} from '@stellar-defi-insurance/sdk';

try {
  await sdk.getSimpleInsurance().createPolicy(params);
} catch (error) {
  if (isStellarDeFiInsuranceError(error)) {
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
  }

  // Handle specific error types
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

## Transaction Options

All contract methods support transaction options:

```typescript
const options = {
  timeout: 30000,        // 30 seconds timeout
  fee: 100,             // Custom fee
  simulate: true,       // Only simulate, don't execute
  skipMemo: false       // Skip transaction memo
};

await insurance.createPolicy(params, options);
```

## Health Check

Verify all services are accessible:

```typescript
const health = await sdk.healthCheck();
console.log('Stellar:', health.stellar);
console.log('Soroban:', health.soroban);
console.log('Contracts:', health.contracts);
```

## API Reference

### Main SDK Class

- `constructor(config: SDKConfig)` - Initialize the SDK
- `connectWallet(config: WalletConfig)` - Connect a wallet
- `disconnectWallet()` - Disconnect current wallet
- `getSimpleInsurance()` - Get insurance contract interface
- `getYieldAggregator()` - Get yield aggregator interface
- `getTreasury()` - Get treasury interface
- `healthCheck()` - Check service health
- `getServer()` - Get Stellar Horizon server
- `getSorobanClient()` - Get Soroban RPC client

### Types

The SDK exports comprehensive TypeScript types:

```typescript
import type {
  NetworkConfig,
  ContractAddress,
  InsurancePolicy,
  ClaimRequest,
  YieldInfo,
  PolicyStatus,
  RiskLevel,
  TransactionOptions
} from '@stellar-defi-insurance/sdk';
```

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Watch mode for development
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://docs.stellar-defi-insurance.com)
- 🐛 [Issues](https://github.com/your-org/stellar-defi-insurance/issues)
- 💬 [Discord Community](https://discord.gg/stellar-defi-insurance)