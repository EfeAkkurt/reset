# 🔧 Current Soroban CLI Commands (2024)

## 📋 Installation

```bash
# Quick installation (recommended)
curl -L https://github.com/stellar/soroban-tools/releases/latest/download/soroban-install.sh | sh

# Homebrew (macOS)
brew install stellar/soroban

# Verify installation
soroban --version
```

## 🏗️ Contract Development

### Build Commands
```bash
# Build contract from source
soroban contract build

# Build with release optimizations
soroban contract build --release

# Build for specific target
soroban contract build --target wasm32-unknown-unknown
```

### Contract Inspection
```bash
# Inspect WASM file
soroban contract inspect --wasm target/wasm32-unknown-unknown/release/contracts.wasm

# Generate contract ID
soroban contract id --wasm target/wasm32-unknown-unknown/release/contracts.wasm

# Fetch contract Wasm
soroban contract fetch --id CONTRACT_ID
```

## 🚀 Contract Deployment

### Deploy Contract
```bash
# Basic deployment
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --source alice \
  --network testnet

# With custom network
soroban contract deploy \
  --wasm contracts.wasm \
  --source GB... \
  --network standalone \
  --rpc-url http://localhost:8000/soroban/rpc

# With alias
soroban contract deploy \
  --wasm contracts.wasm \
  --source alice \
  --network testnet \
  --alias my-contract

# With ignore safety checks
soroban contract deploy \
  --wasm contracts.wasm \
  --source alice \
  --network testnet \
  --ignore-checks
```

## ⚡ Contract Invocation

### Invoke Contract Methods
```bash
# View contract help
soroban contract invoke \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  -- --help

# Basic invocation
soroban contract invoke \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  method_name \
  --arg1 value1 \
  --arg2 value2

# View-only (simulate only)
soroban contract invoke \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  --is-view \
  -- \
  get_value

# With custom fee
soroban contract invoke \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  --fee 500 \
  -- \
  method_name
```

## 📖 Contract Data

### Read Contract State
```bash
# Read specific key
soroban contract read \
  --id CONTRACT_ID \
  --key "state_key" \
  --network testnet

# Read from specific ledger
soroban contract read \
  --id CONTRACT_ID \
  --key "state_key" \
  --ledger 1000
```

## 🔑 Identity Management

### Generate Keys
```bash
# Generate identity (using Stellar CLI - requires network parameters)
stellar keys generate alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone

# Get address
stellar keys address alice

# List all identities
stellar keys ls

# Fund identity (on standalone network)
stellar keys fund alice --network standalone

# Alternative: Use Soroban CLI with network parameters
soroban keys generate alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone
```

## 🌐 Network Management

### Container Networks
```bash
# Start local network container (requires network parameter)
soroban network container start local

# View container logs
soroban network container logs

# Stop container
soroban network container stop
```

### Network Configuration
```bash
# List networks
soroban network ls

# Add custom network
soroban network add \
  --name mynet \
  --rpc-url "http://localhost:8000/soroban/rpc" \
  --network-passphrase "My Network"

# Remove network
soroban network rm mynet
```

### Network Parameters
```bash
# RPC URL
--rpc-url http://localhost:8000/soroban/rpc

# Network passphrase
--network-passphrase "Standalone Network ; February 2017"

# Network name
--network testnet
--network futurenet
--network standalone

# Fee amount
--fee 500

# Simulation mode
--sim-only
--build-only
```

## 🔧 Transaction Operations

### Transaction Management
```bash
# Build transaction only
soroban tx build \
  --source alice \
  --network testnet \
  --sim-only

# Simulate transaction
soroban tx \
  --source alice \
  --network testnet \
  --simulate

# Sign transaction
soroban tx \
  --source alice \
  --sign

# Send transaction
soroban tx \
  --source alice \
  --send
```

## 📊 XDR Operations

### XDR Encoding/Decoding
```bash
# Encode to XDR
soroban xdr encode --type address --value "GB..."

# Decode from XDR
soroban xdr decode --type address --value "AAAA..."

# Convert formats
soroban xdr convert --from hex --to xdr "48656c6c6f"
```

## 📜 Event Streaming

### Event Monitoring
```bash
# Stream events
soroban events \
  --network testnet \
  --cursor now

# Stream specific contract events
soroban events \
  --network testnet \
  --contract-id CONTRACT_ID

# Filter by topic
soroban events \
  --network testnet \
  --topic "contract_invoke"
```

## 🏭️ Asset Operations

### Asset Contracts
```bash
# Generate asset contract ID
soroban contract asset id \
  --asset-code "USD" \
  --issuer "G..."

# Deploy asset contract
soroban contract asset deploy \
  --asset-code "USD" \
  --issuer "G..." \
  --source alice \
  --network testnet
```

## 🔍 Optimization

### Contract Optimization
```bash
# Optimize WASM file
soroban contract optimize \
  --wasm contract.wasm \
  --output optimized.wasm

# Extend contract TTL
soroban contract extend \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  --days 30

# Install WASM without creating instance
soroban contract install \
  --wasm contract.wasm \
  --source alice \
  --network testnet
```

## 📝 Global Options

### Configuration
```bash
# Use global config
--global

# Config directory
--config-dir /path/to/config

# Filter logs
--filter-logs stellar_cli::log::footprint=debug

# Quiet mode
--quiet

# Verbose logging
--verbose
--very-verbose

# Disable cache
--no-cache

# List plugins
--list

# Version
--version
```

## 🎯 Common Workflows

### Complete Local Development
```bash
# 1. Build
cargo build --release --target wasm32-unknown-unknown

# 2. Start local network
soroban network container start local

# 3. Generate keys (using Stellar CLI with network parameters)
stellar keys generate alice \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017" \
  --network standalone

# 4. Fund account
curl -X POST "http://localhost:8000/friendbot?addr=$(stellar keys address alice)"

# 5. Deploy contract
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --source alice \
  --network standalone)

# 6. Test contract
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network standalone \
  -- \
  initialize

# 7. Stop network
soroban network container stop
```

### Testnet Deployment
```bash
# Deploy to testnet
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --source alice \
  --network testnet)

# Test on testnet
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  contract_method
```

### Contract Development Cycle
```bash
# 1. Development
# Edit contract files...

# 2. Test locally
cargo test

# 3. Build for deployment
cargo build --release --target wasm32-unknown-unknown

# 4. Test on local network
# (See local development workflow)

# 5. Deploy to testnet for final testing
# (See testnet deployment)
```

These are the **current (2024)** Soroban CLI commands that replace the outdated syntax. The tool has been significantly improved with better error handling, more intuitive commands, and enhanced container support! 🚀