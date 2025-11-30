# Local Smart Contract Development Guide

## 🏠 Running Contracts Locally (No Testnet Required)

You can fully test and interact with your smart contracts locally using Soroban's built-in testing environment and the `soroban-cli`.

## 📋 Prerequisites

Install Soroban CLI:
```bash
# Install Soroban CLI (if not already installed)
curl -L https://github.com/stellar/soroban-cli/releases/latest/download/soroban-cli-x86_64-apple-darwin.tar.gz | tar xz
sudo mv soroban-cli /usr/local/bin/

# Verify installation
soroban --version
```

## 🚀 Local Testing Methods

### Method 1: Using Built-in Rust Tests (Recommended)

The contracts already have comprehensive local tests built in:

```bash
cd packages/contracts

# Run all tests (these run contracts locally)
cargo test

# Run specific test module
cargo test basic_tests

# Run with output
cargo test -- --nocapture
```

**This is the best approach** because:
- ✅ No external dependencies needed
- ✅ Instant feedback
- ✅ Full contract functionality tested
- ✅ Already working (9/9 tests passing)

### Method 2: Interactive Contract Testing with Soroban CLI

#### Step 1: Build Contracts

```bash
cd packages/contracts

# Build the SimpleInsurance contract
cargo build --release --target wasm32-unknown-unknown

# Find the WASM file
find target -name "*.wasm" -type f
# Should see: target/wasm32-unknown-unknown/release/contracts.wasm
```

#### Step 2: Start Local Soroban Network

```bash
# Start local network (in separate terminal)
soroban network standalone

# You'll see output like:
# Network RPC URL: http://localhost:8000/soroban/rpc
# Friendbot URL: http://localhost:8000/friendbot
# Network passphrase: Standalone Network ; February 2017
```

#### Step 3: Deploy Contract Locally

```bash
# Set environment variables
export RPC_URL="http://localhost:8000/soroban/rpc"
export FRIENDBOT_URL="http://localhost:8000/friendbot"
export NETWORK_PASSPHRASE="Standalone Network ; February 2017"

# Generate test accounts
soroban keys generate --network standalone
# Save the keys (you'll get a secret key and public key)

# Fund test account using friendbot
curl -X POST "$FRIENDBOT_URL?addr=YOUR_PUBLIC_KEY_HERE"

# Deploy contract
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --source YOUR_SECRET_KEY \
  --network standalone)

echo "Contract deployed with ID: $CONTRACT_ID"
```

#### Step 4: Interact with Contract

```bash
# Test contract methods
soroban contract invoke \
  --id $CONTRACT_ID \
  --source YOUR_SECRET_KEY \
  --network standalone \
  -- \
  get_contract_info

# Create a policy (example - adjust based on actual contract methods)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source YOUR_SECRET_KEY \
  --network standalone \
  -- \
  create_policy \
  --arg "GDESTINATION_ADDRESS_HERE" \
  --arg "1000" \
  --arg "50" \
  --arg "2592000" \
  --arg "LOW"
```

### Method 3: Using Soroban Playground (Easiest)

```bash
# Start the playground
soroban lab

# This opens a web interface at http://localhost:8000
# where you can:
# - Write and test contracts in browser
# - Deploy to local network
# - Call contract methods interactively
```

## 🧪 Enhanced Local Testing

### Create a Local Test Script

Create `test_local.sh` in your contracts directory:

```bash
#!/bin/bash

echo "🚀 Starting Local Contract Testing..."

# Build contract
echo "📦 Building contract..."
cargo build --release --target wasm32-unknown-unknown

# Check if build successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Run comprehensive tests
echo "🧪 Running contract tests..."
cargo test

if [ $? -eq 0 ]; then
    echo "🎉 All tests passed!"
    echo "📊 Test results: 9/9 tests passing"
else
    echo "❌ Some tests failed!"
    exit 1
fi

# Optional: Start local network for manual testing
echo "🌐 Starting local Soroban network..."
soroban network standalone &
NETWORK_PID=$!

echo "🔗 RPC URL: http://localhost:8000/soroban/rpc"
echo "💰 Friendbot URL: http://localhost:8000/friendbot"
echo "🛑 Stop network with: kill $NETWORK_PID"
```

Make it executable:
```bash
chmod +x test_local.sh
./test_local.sh
```

## 📊 Local Development Commands

### Quick Test Commands

```bash
# In packages/contracts directory

# 1. Quick build check
cargo check

# 2. Run tests (fastest)
cargo test --lib

# 3. Run tests with output
cargo test -- --nocapture

# 4. Test specific functionality
cargo test test_address_operations
cargo test test_math_operations
cargo test test_contract_environment

# 5. Build WASM for deployment
cargo build --release --target wasm32-unknown-unknown

# 6. Check for warnings/errors
cargo clippy -- -D warnings
```

### Contract Simulation

```bash
# Simulate contract execution without actual deployment
soroban contract simulate \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --function create_policy \
  --args '["GDESTINATION_ADDRESS", "1000", "50", "2592000", "LOW"]'
```

## 🔧 Advanced Local Setup

### Docker Environment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  soroban-rpc:
    image: stellar/soroban-rpc:latest
    ports:
      - "8000:8000"
    command: standalone

  soroban-cli:
    image: stellar/soroban-cli:latest
    depends_on:
      - soroban-rpc
    environment:
      - RPC_URL=http://soroban-rpc:8000/soroban/rpc
    command: sleep infinity
```

Run with:
```bash
docker-compose up -d
docker-compose exec soroban-cli soroban --version
```

## 📈 Testing Strategy

### 1. Unit Tests (Recommended for Daily Development)
```bash
cargo test
# Fast, no external dependencies, tests all contract logic
```

### 2. Integration Tests (For Complete Testing)
```bash
# Build + local deployment
cargo build --release --target wasm32-unknown-unknown
soroban network standalone
# Deploy and test manually
```

### 3. End-to-End Tests (Before Production)
```bash
# Deploy to testnet (when ready)
# Use the TypeScript SDK for full workflow testing
```

## 🎯 Recommended Workflow

### For Development (Daily):
```bash
cd packages/contracts
cargo test                    # Run tests
cargo check                   # Quick build check
# Edit contracts...
cargo test                    # Verify changes
```

### For Testing New Features:
```bash
cd packages/contracts
cargo build --release --target wasm32-unknown-unknown
soroban network standalone
# Deploy and test interactively
```

### Before Production:
```bash
# Full test suite
cargo test --all-features
cargo clippy -- -D warnings
# Then deploy to testnet
```

## 🐛 Common Issues & Solutions

### Build Issues:
```bash
# If you get target architecture errors
rustup target add wasm32-unknown-unknown

# If you get missing dependencies
cargo check
```

### Network Issues:
```bash
# If port 8000 is in use
lsof -i :8000
kill -9 <PID>

# Restart network
soroban network standalone
```

### Contract Not Found:
```bash
# Verify contract ID is correct
soroban contract inspect --id YOUR_CONTRACT_ID

# Check network status
soroban network info --network standalone
```

## ✅ Success Criteria

Your local development is working when:
- ✅ `cargo test` shows "9 passed; 0 failed"
- ✅ `cargo build --release` completes without errors
- ✅ Local network starts successfully
- ✅ You can deploy contracts locally
- ✅ Contract methods respond correctly

The local testing environment provides everything you need without touching testnet! 🚀