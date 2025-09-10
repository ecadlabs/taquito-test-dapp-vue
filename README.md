# 🚀 Taquito Test dApp

> **Test dApp demonstrating Tezos blockchain interactions with visual diagrams and examples**

## 🌐 Live Deployments

| Network       | URL                                |
| ------------- | ---------------------------------- |
| **Seoulnet**  | https://seoulnet.dapp.taquito.io/  |
| **Rionet**    | https://rionet.dapp.taquito.io/    |
| **Shadownet** | https://shadownet.dapp.taquito.io/ |
| **Ghostnet**  | https://ghostnet.dapp.taquito.io/  |

## ✨ Available Tests

### 🎯 **Core Operations**

- **Transfer Tez** - Send tokens between addresses
- **Fee Estimation** - Calculate transaction costs
- **Batch Operations** - Group multiple operations

### 🏗️ **Smart Contracts**

- **Counter Contract** - Basic contract interactions
- **Storage Management** - Increase paid storage of a contract
- **Transaction Limits** - Custom gas/storage limits
- **Failing Noop** - Forcing an operation failure
- **Global Constants** - Registering global constants
- **Intentional Contract Call Failure** - Various types of failures you could run into with calling smart contracts
- **Complex Parameters** - More complex contract interactions such as records, nested structures, maps, and sets
- **TZIP-16 Metadata** - Fetching metadata from contract storage or off-chain storage, along with calling contract views

### 🔐 **Staking & Consensus**

- **Token Staking** - Stake/unstake operations
- **Delegation** - Delegate to bakers

### 🛡️ **Cryptography & Security**

- **Payload Signing** - Sign and verify data

## 🎨 Key Features

- **📊 Visual Learning** - Interactive diagrams showing operation flows
- **🌍 Multi-Network** - Available across multiple Tezos testnets
- **🔐 Multiple Wallet Connection Methods** - Support for Beacon, WalletConnect, Ledger devices, and a direct private key
- **🎭 Modern UI** - Built with Vue 3 + Shadcn-vue

## 🛠️ Development

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Tezos Wallet** (Temple, Kukai, etc.)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ecadlabs/taquito-test-dapp-vue.git
cd taquito-test-dapp-vue

# Install dependencies
npm ci

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run Playwright tests
npm run test:ui      # Run tests with UI

# Contract Management
npm run originate    # Deploy contracts
npm run fund-wallet  # Fund test wallet
npm run reveal-key   # Reveal public key for a wallet

# Code Quality
npm run lint         # Lint code
npm run format       # Format code
```

### Project Structure

```
src/
├── components/        # Reusable UI components from Shadcn-vue
├── modules/tests/     # Test implementations & metadata
├── contracts/         # Smart contract source code
├── stores/            # Pinia state management
├── scripts/           # Utility scripts
└── types/             # TypeScript type definitions
```
