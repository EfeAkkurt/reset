# Stellar DeFi Insurance System - Development Guide

## Overview

This guide provides comprehensive instructions for implementing, testing, and using the Stellar DeFi Insurance System smart contracts built with Soroban SDK.

## 🏗️ Architecture Overview

### Project Structure

```
smart-contracts/
├── packages/
│   └── contracts/
│       ├── src/
│       │   ├── lib.rs                    # Main library entry point
│       │   ├── simple_insurance.rs       # Working insurance contract
│       │   ├── shared/
│       │   │   └── mod.rs                # Shared utilities and error types
│       │   ├── insurance/               # Insurance module (complex version)
│       │   │   ├── contract.rs
│       │   ├── contract_simple.rs      # Simplified working version
│       │   ├── types.rs
│       │   └── mod.rs
│       │   ├── yield_aggregator/        # Yield aggregation module
│       │   │   ├── contract.rs
│       │   ├── contract_simple.rs      # Simplified working version
│       │   ├── types.rs
│       │   └── mod.rs
│       │   ├── treasury/                # Treasury management module
│       │   │   ├── contract.rs
│       │   ├── contract_simple.rs      # Simplified working version
│       │   ├── types.rs
│       │   └── mod.rs
│       │   └── tests/
│       │       └── simple_insurance_test.rs
│       ├── Cargo.toml                   # Rust dependencies and config
│       └── target/                      # Build output (generated)
├── docs/                               # Documentation
├── CONTRACTS_SUMMARY.md               # Technical summary
└── DEVELOPMENT_GUIDE.md                # This file
```

### Contract Types

1. **SimpleInsurance** (`simple_insurance.rs`) - ✅ **Production Ready**
   - Policy creation and management
   - Admin-controlled operations
   - User policy enumeration
   - Basic error handling and validation

2. **YieldAggregator** (`yield_aggregator/contract_simple.rs`) - ✅ **Working Version**
   - Deposit management with allocation
   - Yield calculation (5% APY simplified)
   - Withdrawal processing
   - Total balance tracking

3. **Treasury** (`treasury/contract_simple.rs`) - ✅ **Working Version**
   - Multi-signature transfer approval
   - Emergency shutdown controls
   - Fund allocation management
   - Admin role management

## 🛠️ Development Setup

### Prerequisites

1. **Rust Toolchain**
   ```bash
   # Install Rust (if not already installed)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

   # Add WebAssembly target
   rustup target add wasm32-unknown-unknown
   ```

2. **Node.js** (for future TypeScript SDK)
   ```bash
   # Install Node.js 18+ if not already installed
   nvm install 18
   nvm use 18
   ```

### Building the Contracts

1. **Navigate to contracts directory**
   ```bash
   cd packages/contracts
   ```

2. **Build in release mode**
   ```bash
   cargo build --release
   ```

3. **Expected Output**
   ```
   Compiling contracts v0.1.0 (/path/to/smart-contracts/packages/contracts)
   Finished `release` profile [optimized] target(s) in X.XXs
   ```

4. **Locate compiled contract**
   ```bash
   # The WASM file will be at:
   ls target/wasm32-unknown-unknown/release/contracts.wasm
   ```

### Testing

1. **Run unit tests**
   ```bash
   cargo test --lib
   ```

2. **Run specific test**
   ```bash
   cargo test test_contract_initialization
   ```

3. **Check code (linting)**
   ```bash
   cargo check
   ```

## 📦 Contract Implementation Details

### 1. SimpleInsurance Contract

#### Key Functions

```rust
// Initialize contract with admin address
SimpleInsurance::__constructor(env, admin_address)

// Create a new insurance policy
let policy_id = SimpleInsurance::create_policy(env, holder_address, amount)

// Get policy details
let policy = SimpleInsurance::get_policy(env, policy_id)

// Get all policies for a user
let policies = SimpleInsurance::get_user_policies(env, user_address)

// Deactivate a policy (admin only)
SimpleInsurance::deactivate_policy(env, policy_id)
```

#### Usage Example

```rust
use soroban_sdk::{Address, Env};
use contracts::SimpleInsurance;

let env = Env::default();
let admin = Address::from_str(&env, "G...");

// Initialize
SimpleInsurance::__constructor(env.clone(), admin);

// Create policy
let holder = Address::from_str(&env, "G...");
let policy_id = SimpleInsurance::create_policy(env.clone(), holder, 1000i128);

// Verify
let policy = SimpleInsurance::get_policy(env, policy_id);
assert_eq!(policy.amount, 1000);
```

### 2. YieldAggregator Contract

#### Key Functions

```rust
// Initialize with admin and default insurance allocation
YieldAggregator::__constructor(env, admin_address, default_insurance_percentage)

// Create a deposit
let deposit_id = YieldAggregator::deposit(env, depositor_address, amount, insurance_percentage)

// Withdraw from deposit
YieldAggregator::withdraw(env, deposit_id, amount)

// Claim yield (simplified 5% APY)
let yield_amount = YieldAggregator::claim_yield(env, deposit_id)

// Get deposit details
let deposit = YieldAggregator::get_deposit(env, deposit_id)

// Get total contract balance
let balance = YieldAggregator::get_total_balance(env)
```

#### Usage Example

```rust
// Create deposit with 10% insurance allocation
let deposit_id = YieldAggregator::deposit(
    env.clone(),
    depositor_address,
    1000i128,
    Some(10) // 10% to insurance
);

// Simulate yield after some time
let yield_amount = YieldAggregator::claim_yield(env.clone(), deposit_id);
println!("Yield earned: {}", yield_amount);
```

### 3. Treasury Contract

#### Key Functions

```rust
// Initialize treasury with owner and admins
Treasury::__constructor(env, owner_address, initial_admins)

// Submit transfer for approval
Treasury::submit_transfer(
    env,
    transfer_id,
    recipient_address,
    amount,
    reason_symbol,
    required_approvals,
    is_emergency
)

// Approve a pending transfer
Treasury::approve_transfer(env, transfer_id)

// Add funds to treasury
Treasury::add_funds(env, from_address, amount)

// Get pending transfer
let transfer = Treasury::get_pending_transfer(env, transfer_id)

// Emergency controls
Treasury::emergency_shutdown(env)
Treasury::disable_emergency_shutdown(env)
```

#### Multi-Signature Workflow

```rust
// 1. Admin submits transfer
Treasury::submit_transfer(env, transfer_id, recipient, 1000, reason, 2, false);

// 2. Multiple admins approve
Treasury::approve_transfer(env, transfer_id); // Admin 1
Treasury::approve_transfer(env, transfer_id); // Admin 2

// 3. Transfer executes automatically when sufficient approvals received
```

## 🚀 Deployment Guide

### Testnet Deployment

1. **Prepare Environment**
   ```bash
   # Ensure Stellar testnet is configured
   # Set up testnet credentials
   export STELLAR_NETWORK="testnet"
   ```

2. **Deploy Contract**
   ```bash
   # Using Soroban CLI (if available)
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
     --network testnet
   ```

3. **Alternative: Manual Deployment**
   ```bash
   # If using stellar-cli or other tools
   # Upload WASM file to testnet
   # Create contract instance
   # Initialize with admin address
   ```

4. **Contract Configuration**
   - Set initial admin addresses
   - Configure default parameters
   - Fund treasury with initial capital

### Initialization Parameters

```rust
// Insurance Contract
SimpleInsurance::__constructor(env, admin_address);

// Yield Aggregator
YieldAggregator::__constructor(env, admin_address, 10); // 10% insurance default

// Treasury
let initial_admins = Vec::from_array(&env, [admin1, admin2, admin3]);
Treasury::__constructor(env, owner_address, initial_admins);
```

## 🔧 Integration Guide

### Backend Integration

1. **Contract ABI**
   ```rust
   // Export contract interface for backend
   use contracts::{SimpleInsurance, YieldAggregator, Treasury};
   ```

2. **Risk Analysis Integration**
   - Keep complex calculations in backend
   - Use contracts for simple validation and storage
   - Backend validates before on-chain operations

3. **Event Monitoring**
   ```rust
   // Listen for contract events
   env.events().publish((Symbol::new(&env, "policy_created"), policy_id), ());
   ```

### Frontend Integration (Future)

1. **TypeScript SDK Structure**
   ```typescript
   class InsuranceContract {
     async createPolicy(holder: string, amount: number): Promise<string>
     async getPolicy(policyId: string): Promise<Policy>
     async getUserPolicies(user: string): Promise<string[]>
   }
   ```

2. **Wallet Integration**
   - Connect to Stellar wallets
   - Sign transactions
   - Handle contract interactions

## 🧪 Testing Strategy

### Unit Tests

1. **Contract Initialization**
   ```rust
   #[test]
   fn test_contract_initialization() {
       let env = Env::default();
       let admin = create_test_address(&env, 1);
       SimpleInsurance::__constructor(env.clone(), admin);
       // Test successful initialization
   }
   ```

2. **Function Testing**
   ```rust
   #[test]
   fn test_policy_creation() {
       let env = Env::default();
       // Setup
       let policy_id = SimpleInsurance::create_policy(env.clone(), holder, 1000);
       let policy = SimpleInsurance::get_policy(env, policy_id);
       assert_eq!(policy.amount, 1000);
   }
   ```

### Integration Tests

1. **Cross-Contract Testing**
   - Test contract interactions
   - Verify data flow between contracts
   - Test multi-signature workflows

2. **Economic Testing**
   - Test yield calculations
   - Verify fund allocations
   - Test emergency scenarios

## 🔍 Monitoring and Debugging

### Logging

1. **Contract Events**
   ```rust
   env.events().publish((Symbol::new(&env, "operation"), data), ());
   ```

2. **Error Handling**
   ```rust
   panic_with_error!(&env, ContractError::InvalidInput);
   ```

### Debugging Tools

1. **Soroban Explorer**
   - View contract state
   - Monitor transactions
   - Analyze contract calls

2. **Local Testing**
   ```bash
   # Run contracts locally
   cargo test
   ```

## 📊 Performance Considerations

### Gas Optimization

1. **Storage Efficiency**
   - Use appropriate data types
   - Minimize storage operations
   - Batch operations when possible

2. **Computation Efficiency**
   - Pre-calculate complex operations
   - Use efficient algorithms
   - Avoid unnecessary loops

### Scaling Considerations

1. **Storage Growth**
   - Monitor contract storage usage
   - Implement data cleanup mechanisms
   - Use pagination for large datasets

2. **Transaction Throughput**
   - Optimize transaction patterns
   - Batch operations
   - Use async patterns where applicable

## 🔒 Security Best Practices

### Access Control

1. **Role-Based Permissions**
   ```rust
   // Check admin rights
   if caller != admin_address {
       panic_with_error!(&env, ContractError::Unauthorized);
   }
   ```

2. **Input Validation**
   ```rust
   if amount <= 0 {
       panic_with_error!(&env, ContractError::InvalidInput);
   }
   ```

### Audit Recommendations

1. **Code Review**
   - Review all contract functions
   - Check for common vulnerabilities
   - Verify business logic

2. **Security Testing**
   - Test edge cases
   - Verify access controls
   - Test economic attacks

## 📋 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check Rust version
   rustc --version

   # Clean build
   cargo clean
   cargo build --release
   ```

2. **Contract Deployment Issues**
   - Verify WASM compilation
   - Check network configuration
   - Validate initialization parameters

3. **Test Failures**
   ```bash
   # Run specific test with verbose output
   cargo test --nocapture test_name
   ```

### Debug Commands

1. **Contract State Inspection**
   ```bash
   # View contract storage (if tooling available)
   soroban contract read <contract_id> <key>
   ```

2. **Transaction Analysis**
   ```bash
   # Analyze failed transactions
   stellar transaction-info <tx_hash>
   ```

## 🚀 Next Steps

### Immediate Actions

1. **Deploy to Testnet**
   - Deploy SimpleInsurance contract
   - Test basic functionality
   - Verify integration points

2. **TypeScript SDK Development**
   - Create contract client classes
   - Implement error handling
   - Add wallet integration

3. **Backend Integration**
   - Connect contract events to backend
   - Implement risk analysis pipeline
   - Set up monitoring

### Future Enhancements

1. **Advanced Features**
   - Complex yield strategies
   - Dynamic risk assessment
   - Governance mechanisms

2. **Production Readiness**
   - Security audit
   - Performance optimization
   - Comprehensive testing

## 📞 Support and Resources

### Documentation

- [Soroban Documentation](https://soroban.stellar.org/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Stellar Developers](https://developers.stellar.org/)

### Community

- [Stellar Discord](https://discord.gg/stellar)
- [Soroban GitHub](https://github.com/stellar/soroban)
- [Rust Community](https://users.rust-lang.org/)

---

This development guide provides comprehensive instructions for working with the Stellar DeFi Insurance System smart contracts. The system is designed with modularity and security in mind, making it ready for production deployment after proper testing and auditing.