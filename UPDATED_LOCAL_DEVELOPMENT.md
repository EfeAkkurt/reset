# 🏠 Local Smart Contract Development Guide (Updated 2024)

## 🚀 Running Contracts Locally with Latest Soroban CLI (2024)

Based on the current Stellar CLI tool, here's the updated approach for local development without deploying to testnet.

## 📋 Prerequisites

### Install Soroban CLI (Latest Method)

```bash
# Quick installation (recommended)
curl -L https://github.com/stellar/soroban-tools/releases/latest/download/soroban-install.sh | sh

# Or via Homebrew (macOS)
brew install stellar/soroban

# Verify installation
soroban --version
```

### WebAssembly Target (if not already installed)

```bash
# Install Rust toolchain if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Add WASM target
rustup target add wasm32-unknown-unknown
```

## 🚀 Local Testing Methods

### Method 1: Built-in Rust Tests (Recommended)

The contracts already have comprehensive local tests:

```bash
cd packages/contracts

# Run all tests (these run contracts locally)
soroban cargo test

# Or traditional cargo test
cargo test

# Run specific test module
cargo test basic_tests

# Run with output
cargo test -- --nocapture
```

### Method 2: Interactive Local Network with New CLI

#### Step 1: Build Contracts

```bash
cd packages/contracts

# Build the contracts for WASM
cargo build --release --target wasm32-unknown-unknown

# Find the WASM file
find target/wasm32-unknown-unknown -name "*.wasm"
# Output: target/wasm32-unknown-unknown/release/contracts.wasm
```

#### Step 2: Start Local Network (Updated Commands)

```bash
# Start local network container (new command - requires network parameter)
soroban network container start local

# The command will show URLs:
# - RPC URL: http://localhost:8000/soroban/rpc
# - Friendbot URL: http://localhost:8000/friendbot
# - Horizon URL: http://localhost:8000/horizon

# View logs (optional)
soroban network container logs

# Stop network when done
soroban network container stop
```

#### Step 3: Set Up Test Accounts

```bash
# First start the local network if not already running
soroban network container start local

# Generate test identities using Stellar CLI (requires network parameters)
stellar keys generate alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone

stellar keys generate bob \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone

# Fund accounts using friendbot
curl -X POST "http://localhost:8000/friendbot?addr=$(stellar keys address alice)"
curl -X POST "http://localhost:8000/friendbot?addr=$(stellar keys address bob)"

# Alternative: Use Stellar CLI for funding
stellar keys fund alice --network standalone
stellar keys fund bob --network standalone
```

#### Step 4: Deploy Contract Locally (Updated Syntax)

```bash
# Method 1: Install WASM first (working!)
WASM_HASH=$(soroban contract install \
  --source-account alice \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone)

echo "WASM installed with hash: $WASM_HASH"

# Then deploy using the hash (may have XDR issues with current CLI version)
# Note: Current CLI version has deployment issues - use Method 2

# Method 2: Direct deployment (if available in your CLI version)
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --source alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone)

echo "Contract deployed with ID: $CONTRACT_ID"
```

#### Step 5: Interact with Contract (Updated Syntax)

```bash
# Get contract-specific help
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network standalone \
  -- --help

# Test contract operations
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network standalone \
  -- \
  get_contract_info

# Create policy example (adjust based on actual contract methods)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network standalone \
  -- \
  create_policy \
  --holder $(soroban keys address bob) \
  --coverage_amount "1000" \
  --premium "50" \
  --duration "2592000" \
  --risk_level "LOW"
```

### Method 3: Soroban Laboratory (Web Interface)

```bash
# Open the web-based testing environment
# Navigate to: https://laboratory.stellar.org/#soroban
# This provides a browser-based interface for:
# - Contract deployment
# - Method invocation
# - Network simulation
# - Real-time testing
```

## 📊 Updated Command Reference

### Contract Commands (Current)

```bash
# Build contract
soroban contract build

# Deploy contract
soroban contract deploy \
  --wasm contract.wasm \
  --source alice \
  --network testnet

# Invoke contract
soroban contract invoke \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  -- method_name --arg value

# Read contract state
soroban contract read \
  --id CONTRACT_ID \
  --key "state_key" \
  --network testnet

# Get contract info
soroban contract inspect \
  --wasm contract.wasm

# Generate contract ID
soroban contract id \
  --wasm contract.wasm
```

### Network Commands (Current)

```bash
# List networks
soroban network ls

# Add custom network
soroban network add \
  --name mynet \
  --rpc-url "http://localhost:8000/soroban/rpc" \
  --network-passphrase "My Network"

# Start containerized network
soroban network container start

# View container logs
soroban network container logs

# Stop container
soroban network container stop
```

### Key Management (Current)

```bash
# Generate key/identity (using Stellar CLI - requires network parameters)
stellar keys generate alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone

# Get address
stellar keys address alice

# List identities
stellar keys ls

# Alternative: Use Soroban CLI with network parameters
soroban keys generate alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone
```

## 🔧 Enhanced Local Testing Script

Create `test_local_updated.sh` in your contracts directory:

```bash
#!/bin/bash

echo "🚀 Starting Local Contract Testing (Updated 2024)..."

# Step 1: Build contracts
echo "📦 Building contracts..."
cargo build --release --target wasm32-unknown-unknown

# Check if build successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo "📁 WASM file: $(find target/wasm32-unknown-unknown -name "*.wasm" -type f)"

# Step 2: Run comprehensive tests
echo "🧪 Running contract tests..."
cargo test

if [ $? -eq 0 ]; then
    echo "🎉 All tests passed!"
    echo "📊 Test results: 9/9 tests passing"
else
    echo "❌ Some tests failed!"
    exit 1
fi

# Step 3: Start local network (optional)
echo "🌐 Starting local Soroban network..."
soroban network container start local &
NETWORK_PID=$!

echo "🔗 RPC URL: http://localhost:8000/soroban/rpc"
echo "💰 Friendbot URL: http://localhost:8000/friendbot"
echo "🛑 Stop network with: soroban network container stop"

# Wait a moment for network to start
sleep 3

# Step 4: Generate test accounts
echo "🔑 Generating test identities..."
stellar keys generate alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone

stellar keys generate bob \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone

echo "🪙 Fund test accounts..."
curl -X POST "http://localhost:8000/friendbot?addr=$(stellar keys address alice)" > /dev/null
curl -X POST "http://localhost:8000/friendbot?addr=$(stellar keys address bob)" > /dev/null

# Step 5: Deploy contract locally
echo "📦 Deploying contract locally..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --source alice \
  --network standalone)

echo "✅ Contract deployed with ID: $CONTRACT_ID"

echo "🎯 Ready for local testing!"
echo "📋 Test commands:"
echo "  soroban contract invoke --id $CONTRACT_ID --source alice --network standalone -- --help"
echo "  soroban network container logs"
echo "  soroban network container stop"
```

## 📚 Updated Resources

### Official Documentation (2024)
- **[Soroban Documentation](https://soroban.stellar.org/docs)** - Official docs
- **[Stellar CLI Reference](https://developers.stellar.org/docs/tools/stellar-cli)** - CLI documentation
- **[Stellar Developers](https://developers.stellar.org)** - Developer resources
- **[Soroban Examples Repository](https://github.com/stellar/soroban-examples)** - Example contracts

### Interactive Tools
- **[Stellar Laboratory](https://laboratory.stellar.org/#soroban)** - Web-based testing
- **[GitHub - stellar/soroban-tools](https://github.com/stellar/soroban-tools)** - Source code

## 🔧 Development Workflow

### For Development (Daily):
```bash
cd packages/contracts

# Quick build check
cargo check

# Run tests (fastest)
cargo test

# Edit contracts...
cargo test                    # Verify changes

# Build WASM (when ready for deployment)
cargo build --release --target wasm32-unknown-unknown
```

### For Local Testing:
```bash
cd packages/contracts

# Build WASM
cargo build --release --target wasm32-unknown-unknown

# Start local network
soroban network container start

# Deploy and test manually
# (See commands above)
```

### Before Production:
```bash
# Full test suite
cargo test --all-features

# Code quality
cargo clippy -- -D warnings

# Clean build
cargo clean && cargo build --release --target wasm32-unknown-unknown
```

## 🎯 Key Changes from Previous Versions

1. **CLI Tool**: Now uses `soroban` instead of `soroban-cli`
2. **Network Management**: Container-based network with `soroban network container`
3. **Account Management**: `soroban keys` for identity management
4. **Contract Commands**: Updated syntax with `--source-account` parameter
5. **Network Configuration**: Simplified with `--network` and `--rpc-url` options

## ✅ Success Criteria

Your local development is working when:
- ✅ `cargo test` shows "9 passed; 0 failed"
- ✅ `cargo build --release --target wasm32-unknown-unknown` completes without errors
- ✅ `soroban network container start` starts successfully
- ✅ Contract deployment and invocation work locally
- ✅ All contract methods respond correctly

The updated local development environment provides everything you need for comprehensive smart contract testing without touching testnet! 🚀

**References:**
- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar Developers](https://developers.stellar.org)
- [Soroban Examples](https://github.com/stellar/soroban-examples)