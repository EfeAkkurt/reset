# 🧪 Contract Testing Guide

## 📋 Prerequisites

1. ✅ Local network running
2. ✅ Contract WASM built
3. ✅ Test account funded
4. ✅ TypeScript SDK ready

## 🚀 Step 1: Deploy Contract

### Using Soroban Laboratory (Recommended)

1. **Open**: https://laboratory.stellar.org/#soroban

2. **Configure Local Network**:
   - Click "Settings" (top right)
   - Network: **Local**
   - RPC URL: `http://localhost:8000/soroban/rpc`
   - Network Passphrase: `Standalone Network ; February 2017`

3. **Upload Contract**:
   - Click "Upload WASM"
   - File: `packages/contracts/target/wasm32-unknown-unknown/release/contracts.wasm`

4. **Deploy**:
   - Click "Deploy Contract"
   - Source: select your test account
   - Copy the **Contract ID** that appears

## 🧪 Step 2: Test with TypeScript SDK

### Setup Environment

```bash
cd packages/sdk
npm install
npm run build
```

### Update Test Script

Edit `test-contract-local.ts`:
```typescript
const CONTRACT_ID = "YOUR_DEPLOYED_CONTRACT_ID"; // Paste your contract ID here
```

### Run Tests

```bash
# Show local development info
npx ts-node test-contract-local.ts --info

# Run contract tests
npx ts-node test-contract-local.ts
```

## 📊 Expected Test Results

### Contract Functions Available
Based on your contract inspection, these functions should be available:

- `__constructor(admin: Address)` - Initialize contract
- `create_policy(holder: Address, amount: i128) -> u32` - Create new policy
- `get_policy(policy_id: u32) -> Policy` - Get policy details
- `get_user_policies(user: Address) -> Vec<u32>` - Get user's policy IDs
- `deactivate_policy(policy_id: u32)` - Deactivate policy (admin only)

### Test Output Example
```
🚀 Testing Simple Insurance Contract Locally
==========================================
📦 Contract Configuration:
   Contract ID: CAZKZ7A6K7LX5V5L4K2K3X7J6J5J5K2K3X7J6J5J5K2K3X7J6J5J5K2K3X7J6
   WASM Hash: bd11924e13689e98c0937592cd419652d25d997d0876fef11fef794a7423df3b
   Network: local
   RPC URL: http://localhost:8000/soroban/rpc

📋 Test 1: Getting Contract Information...
✅ Contract Info: { admin: "...", total_policies: 0 }

📝 Test 2: Creating Policy...
✅ Policy Created: { success: true, policyId: 1, transactionHash: "..." }

📄 Test 3: Getting Policy Details...
✅ Policy Details: { holder: "...", amount: 1000, active: true }

👤 Test 4: Getting User Policies...
✅ User Policies: [1, 2, 3]
```

## 🔧 Troubleshooting

### Common Issues

1. **"Contract not found"**
   - Verify contract ID is correct
   - Check contract was deployed successfully

2. **"Network connection failed"**
   - Ensure local network is running: `curl http://localhost:8000/health`
   - Check RPC URL in configuration

3. **"Insufficient balance"**
   - Fund account: `curl -X POST "http://localhost:8000/friendbot?addr=$(stellar keys address testuser)"`

4. **"Permission denied"**
   - Check if function requires admin privileges
   - Use correct account for privileged operations

### Debug Commands

```bash
# Check network status
curl http://localhost:8000/health

# Check account balance
stellar keys address testuser

# Inspect contract functions
soroban contract inspect --wasm target/wasm32-unknown-unknown/release/contracts.wasm

# List your accounts
stellar keys ls
```

## 🎯 Next Steps

1. **Advanced Testing**: Test all contract functions with various parameters
2. **Error Handling**: Test edge cases and error conditions
3. **Integration Testing**: Test contract-to-contract interactions
4. **Performance Testing**: Measure gas costs and execution times

## 📚 Resources

- [Soroban Laboratory](https://laboratory.stellar.org/#soroban)
- [TypeScript SDK Documentation](./packages/sdk/README.md)
- [Contract Development Guide](./DEVELOPMENT_GUIDE.md)
- [Current Development Status](./CURRENT_STATUS.md)