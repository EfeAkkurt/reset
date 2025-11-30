# 🌐 Local Soroban Network Configuration

## **Complete Reference for Your Docker Soroban Setup**

### 🚀 **Service URLs**

| Service | URL | Purpose | Status |
|---------|-----|---------|--------|
| **Soroban RPC** | `http://localhost:8000/soroban/rpc` | Smart contract operations | ✅ Working |
| **Horizon API** | `http://localhost:8000` | Standard Stellar operations | ✅ Working |
| **Friendbot** | `http://localhost:8000/friendbot` | Test account funding | ✅ Working |

### 📋 **Network Configuration**

```javascript
// Configuration for your TypeScript SDK
const CONFIG = {
  // Soroban RPC (for smart contracts)
  RPC_URL: 'http://localhost:8000/soroban/rpc',

  // Horizon API (for standard Stellar operations)
  HORIZON_URL: 'http://localhost:8000',

  // Network details
  NETWORK_PASSPHRASE: 'Standalone Network ; February 2017',
  NETWORK_NAME: 'standalone',

  // Friendbot (for funding test accounts)
  FRIENDBOT_URL: 'http://localhost:8000/friendbot'
};
```

### 🧪 **Testing Commands**

#### **Test Soroban RPC Health**
```bash
curl -s http://localhost:8000/soroban/rpc \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

#### **Test Horizon API**
```bash
curl -s http://localhost:8000/ | jq '.links.account'
```

#### **Fund Account with Friendbot**
```bash
curl -s "http://localhost:8000/friendbot?addr=YOUR_STELLAR_ADDRESS"
```

### 💻 **Usage in Your TypeScript SDK**

```typescript
import {
  SorobanRpc,
  Networks,
  Horizon,
  Server
} from '@stellar/stellar-sdk';

// Soroban RPC (for smart contracts)
const sorobanServer = new SorobanRpc.Server(
  'http://localhost:8000/soroban/rpc',
  { allowHttp: true }
);

// Horizon API (for standard operations)
const horizonServer = new Server(
  'http://localhost:8000'
);

// Usage examples:
async function testConnection() {
  // Test Soroban RPC
  const health = await sorobanServer.getHealth();
  console.log('Soroban Health:', health);

  // Test Horizon
  const root = await horizonServer.root();
  console.log('Horizon Links:', root.links);
}
```

### 🔧 **Account Management**

#### **Generate Test Account**
```bash
stellar keys generate --rpc-url http://localhost:8000/soroban/rpc --network-passphrase "Standalone Network ; February 2017" my-test-account
```

#### **Fund Account**
```bash
# Using Stellar CLI
soroban keys fund G...ADDRESS --rpc-url http://localhost:8000/soroban/rpc --network-passphrase "Standalone Network ; February 2017"

# Using curl
curl -s "http://localhost:8000/friendbot?addr=G...ADDRESS"
```

#### **List Available Accounts**
```bash
stellar keys ls
```

### 🚀 **Contract Deployment**

#### **Install WASM**
```bash
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/contracts.wasm \
  --source-account YOUR_ACCOUNT \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017"
```

#### **Deploy Contract**
```bash
soroban contract deploy \
  --wasm-hash YOUR_WASM_HASH \
  --source-account YOUR_ACCOUNT \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017"
```

### 📊 **Current Network Status**

```bash
# Check network health
curl -s http://localhost:8000/soroban/rpc \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  | jq '.result'

# Current output:
{
  "status": "healthy",
  "latestLedger": 9568,
  "oldestLedger": 7,
  "ledgerRetentionWindow": 120960
}
```

### 🔍 **Available Horizon Endpoints**

| Endpoint | URL | Description |
|----------|-----|-------------|
| Accounts | `http://localhost:8000/accounts` | Account information |
| Transactions | `http://localhost:8000/transactions` | Transaction history |
| Assets | `http://localhost:8000/assets` | Asset information |
| Ledgers | `http://localhost:8000/ledgers` | Ledger information |

### 🛠️ **Docker Container Status**

```bash
# Check container
docker ps | grep stellar

# View logs
docker logs stellar-local --tail 20

# Container details
CONTAINER ID: 733f8fb74a8f
IMAGE: stellar/quickstart:testing
PORTS: 0.0.0.0:8000->8000/tcp
STATUS: Up 3+ hours
NAME: stellar-local
```

### 💡 **Integration Examples**

#### **Stellar JavaScript SDK**
```javascript
const { Server, Networks, TransactionBuilder } = require('@stellar/stellar-sdk');

const server = new Server('http://localhost:8000');
const contractServer = new SorobanRpc.Server('http://localhost:8000/soroban/rpc');

// Network configuration
const networkConfig = {
  networkPassphrase: Networks.STANDALONE,
  horizonUrl: 'http://localhost:8000',
  sorobanRpcUrl: 'http://localhost:8000/soroban/rpc'
};
```

#### **Your TypeScript SDK**
```typescript
// In your packages/sdk/src/index.ts
export const LOCAL_CONFIG = {
  rpcUrl: 'http://localhost:8000/soroban/rpc',
  horizonUrl: 'http://localhost:8000',
  networkPassphrase: 'Standalone Network ; February 2017',
  friendbotUrl: 'http://localhost:8000/friendbot'
};
```

### ✅ **Verification Checklist**

- [x] Soroban RPC: `http://localhost:8000/soroban/rpc` - Working
- [x] Horizon API: `http://localhost:8000` - Working
- [x] Friendbot: `http://localhost:8000/friendbot` - Working
- [x] Network: Standalone - Healthy
- [x] Current Ledger: 9568+ - Syncing
- [x] Docker Container: stellar-local - Running

---

## 🎯 **Quick Reference**

```bash
# RPC URL
http://localhost:8000/soroban/rpc

# Horizon URL
http://localhost:8000

# Friendbot URL
http://localhost:8000/friendbot

# Network Passphrase
"Standalone Network ; February 2017"
```

**Your local Soroban network is fully operational and ready for smart contract development!** 🚀