# 🚀 Your Complete DeFi Insurance SDK - Features Guide

## 📋 **SDK OVERVIEW**

Your `DeFiInsuranceSDK` provides **complete integration** with all three of your deployed smart contracts on Stellar testnet. It's a production-ready TypeScript/JavaScript SDK for building DeFi insurance applications.

---

## 🛡️ **SIMPLE INSURANCE CONTRACT FUNCTIONS**

### **Core Insurance Management:**

#### `createInsurancePolicy(holderAddress, amount, signerSecret)`
```javascript
// Create a new insurance policy
const result = await sdk.createInsurancePolicy(
  "GD7B7JH6G653RVC2GVE2XMMHY6Y2SLVKL77K5CNTWWPTQFIOW5PHYE6O", // holder address
  2500, // coverage amount ($25)
  "SBK55BYH2JBBDEEGL4M5PXIRUEFWXA3K3JGYJVFYZ5XXRCKXDK7XQ4VN" // signer secret
);
// Returns: { success: true, result: transaction_response }
```

#### `getInsurancePolicy(policyId)`
```javascript
// Get policy details by ID
const policy = await sdk.getInsurancePolicy(1);
// Returns: { success: true, result: { holder, amount, status, created_at } }
```

#### `getUserInsurancePolicies(holderAddress)`
```javascript
// Get all policies for a user
const policies = await sdk.getUserInsurancePolicies(
  "GD7B7JH6G653RVC2GVE2XMMHY6Y2SLVKL77K5CNTWWPTQFIOW5PHYE6O"
);
// Returns: { success: true, result: [policy_id1, policy_id2, ...] }
```

#### `deactivateInsurancePolicy(policyId, signerSecret)`
```javascript
// Deactivate an existing policy
const result = await sdk.deactivateInsurancePolicy(1, signerSecret);
// Returns: { success: true, result: transaction_response }
```

---

## 💰 **YIELD AGGREGATOR CONTRACT FUNCTIONS**

### **DeFi Yield Farming with Insurance Protection:**

#### `createYieldDeposit(depositorAddress, amount, insurancePercentage, signerSecret)`
```javascript
// Create a new yield deposit
const result = await sdk.createYieldDeposit(
  "GD7B7JH6G653RVC2GVE2XMMHY6Y2SLVKL77K5CNTWWPTQFIOW5PHYE6O", // depositor
  5000, // deposit amount ($50)
  30, // 30% insurance allocation, 70% yield allocation
  "SBK55BYH2JBBDEEGL4M5PXIRUEFWXA3K3JGYJVFYZ5XXRCKXDK7XQ4VN" // signer secret
);
// Returns: { success: true, result: transaction_response }
```

#### `withdrawFromYieldDeposit(depositId, amount, signerSecret)`
```javascript
// Withdraw from existing deposit
const result = await sdk.withdrawFromYieldDeposit(
  1, // deposit ID
  1000, // withdrawal amount
  signerSecret
);
// Returns: { success: true, result: transaction_response }
```

#### `getYieldDeposit(depositId)`
```javascript
// Get deposit details
const deposit = await sdk.getYieldDeposit(1);
// Returns: {
//   success: true,
//   result: {
//     depositor, amount, allocation, deposit_time
//   }
// }
```

#### `getYieldPoolStats()`
```javascript
// Get pool statistics
const stats = await sdk.getYieldPoolStats();
// Returns: {
//   success: true,
//   result: {
//     total_deposits, total_yield, active_deposits
//   }
// }
```

#### `addYieldToDeposit(depositId, yieldAmount, signerSecret)`
```javascript
// Add yield to a deposit
const result = await sdk.addYieldToDeposit(
  1, // deposit ID
  100, // yield amount to add
  signerSecret
);
// Returns: { success: true, result: transaction_response }
```

---

## 🏛️ **TREASURY CONTRACT FUNCTIONS**

### **Multi-Signature Fund Management:**

#### `createTreasuryTransfer(fromAddress, toAddress, amount, memo, signerSecret)`
```javascript
// Create a new transfer request
const result = await sdk.createTreasuryTransfer(
  "GD7B7JH6G653RVC2GVE2XMMHY6Y2SLVKL77K5CNTWWPTQFIOW5PHYE6O", // from
  "GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A", // to
  1000, // transfer amount
  "Monthly payment", // memo
  signerSecret
);
// Returns: { success: true, result: { transaction_hash, transfer_id } }
```

#### `approveTreasuryTransfer(transferId, signerSecret)`
```javascript
// Approve a pending transfer
const result = await sdk.approveTreasuryTransfer(
  transferId, // transfer ID (Bytes)
  signerSecret
);
// Returns: { success: true, result: transaction_response }
```

#### `rejectTreasuryTransfer(transferId, signerSecret)`
```javascript
// Reject a pending transfer
const result = await sdk.rejectTreasuryTransfer(transferId, signerSecret);
// Returns: { success: true, result: transaction_response }
```

#### `executeTreasuryTransfer(transferId, signerSecret)`
```javascript
// Execute an approved transfer
const result = await sdk.executeTreasuryTransfer(transferId, signerSecret);
// Returns: { success: true, result: transaction_response }
```

#### `getTreasuryTransfer(transferId)`
```javascript
// Get transfer details
const transfer = await sdk.getTreasuryTransfer(transferId);
// Returns: {
//   success: true,
//   result: {
//     transfer_id, from_address, to_address, amount, status, created_at, memo
//   }
// }
```

#### `getPendingTreasuryTransfers()`
```javascript
// Get all pending transfers
const pending = await sdk.getPendingTreasuryTransfers();
// Returns: { success: true, result: [transfer_id1, transfer_id2, ...] }
```

#### `getTreasuryStats()`
```javascript
// Get treasury statistics
const stats = await sdk.getTreasuryStats();
// Returns: {
//   success: true,
//   result: {
//     total_balance, pending_transfers, completed_transfers, total_transferred
//   }
// }
```

---

## 🔧 **UTILITY FUNCTIONS**

### **SDK Management:**

#### `getContractInfo(contractName)`
```javascript
// Get information about a specific contract
const info = await sdk.getContractInfo('simpleInsurance');
// Returns: { success: true, contractId, network }
```

#### `getContractIds()`
```javascript
// Get all contract IDs and network info
const contracts = sdk.getContractIds();
// Returns: {
//   simpleInsurance: "...",
//   yieldAggregator: "...",
//   treasury: "...",
//   network: "testnet",
//   rpcUrl: "https://soroban-testnet.stellar.org"
// }
```

---

## 🚀 **QUICK START EXAMPLES**

### **Complete Insurance + Yield Flow:**
```javascript
const { DeFiInsuranceSDK } = require('./src/multi-contract-sdk');

// Initialize SDK
const sdk = new DeFiInsuranceSDK('testnet');
const userSecret = "YOUR_SECRET_KEY";
const userAddress = "YOUR_PUBLIC_ADDRESS";

async function completeDeFiFlow() {
  try {
    // 1. Create insurance policy
    const policy = await sdk.createInsurancePolicy(
      userAddress, 10000, userSecret
    );
    console.log('✅ Insurance policy created:', policy);

    // 2. Create yield deposit with 30% insurance
    const deposit = await sdk.createYieldDeposit(
      userAddress, 5000, 30, userSecret
    );
    console.log('✅ Yield deposit created:', deposit);

    // 3. Create treasury transfer
    const transfer = await sdk.createTreasuryTransfer(
      userAddress, "RECIPIENT_ADDRESS", 1000, "Payment", userSecret
    );
    console.log('✅ Treasury transfer created:', transfer);

    // 4. Check statistics
    const poolStats = await sdk.getYieldPoolStats();
    const treasuryStats = await sdk.getTreasuryStats();

    console.log('📊 Pool stats:', poolStats);
    console.log('🏛️ Treasury stats:', treasuryStats);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the complete flow
completeDeFiFlow();
```

### **React Integration Example:**
```jsx
import React, { useState, useEffect } from 'react';
import { DeFiInsuranceSDK } from './src/multi-contract-sdk';

function DeFiInsuranceApp() {
  const [sdk] = useState(() => new DeFiInsuranceSDK('testnet'));
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const poolStats = await sdk.getYieldPoolStats();
    const treasuryStats = await sdk.getTreasuryStats();
    setStats({ pool: poolStats.result, treasury: treasuryStats.result });
  };

  const handleCreatePolicy = async () => {
    const result = await sdk.createInsurancePolicy(
      userAddress, coverageAmount, userSecret
    );
    if (result.success) {
      alert('✅ Policy created successfully!');
      loadStats(); // Refresh stats
    }
  };

  return (
    <div>
      <h1>🛡️ DeFi Insurance Platform</h1>

      <div>
        <h2>📊 Platform Statistics</h2>
        <p>Total Deposits: ${stats.pool?.total_deposits || 0}</p>
        <p>Active Deposits: {stats.pool?.active_deposits || 0}</p>
        <p>Completed Transfers: {stats.treasury?.completed_transfers || 0}</p>
      </div>

      <div>
        <h2>🛡️ Insurance</h2>
        <button onClick={handleCreatePolicy}>Create Policy</button>
      </div>

      <div>
        <h2>💰 Yield Farming</h2>
        <button>Create Deposit</button>
      </div>

      <div>
        <h2>🏛️ Treasury</h2>
        <button>Create Transfer</button>
      </div>
    </div>
  );
}
```

---

## 🌟 **SDK ADVANTAGES**

### **✅ Production Ready:**
- **Error handling** for all operations
- **Type safety** with TypeScript support
- **Network abstraction** (testnet/mainnet ready)
- **Transaction management** with proper signing and submission

### **✅ Developer Friendly:**
- **Simple API** - just call functions with parameters
- **Comprehensive coverage** - all contract functions available
- **Built-in validation** and error messages
- **React integration ready**

### **✅ Enterprise Features:**
- **Multi-contract integration** in single SDK
- **Complete transaction lifecycle** management
- **Security best practices** for key handling
- **Scalable architecture** for growth

---

## 🎯 **WHAT YOU CAN BUILD WITH YOUR SDK**

### **Insurance Applications:**
- 🏥 **Health insurance policies** with automated claims
- 🏡 **Property insurance** with smart contracts
- 🚗 **Auto insurance** with usage-based premiums

### **DeFi Yield Products:**
- 💰 **Insurance-protected yield farming**
- 🏦 **Hybrid savings accounts** with insurance
- 📈 **Automated investment portfolios** with protection

### **Treasury Management:**
- 🏛️ **Multi-signature fund management**
- 💼 **Corporate treasury operations**
- 🤝 **Escrow services** with approval workflows

**🚀 Your SDK provides everything needed to build a complete DeFi insurance ecosystem!**