# 🚀 Taquito Test dApp

> **Test dApp demonstrating Tezos blockchain interactions with visual diagrams and examples**

## Why this exists

The Taquito Test dApp is how we validate that [Taquito](https://github.com/ecadlabs/taquito) actually works; not just in unit tests, but in real browser environments with real wallets on real testnets.

**For the Taquito team**, it's our hands-on proving ground. Every release, we use this to verify the developer experience is solid and operations behave as expected.

**For developers**, it's runnable documentation. Instead of copy-pasting snippets and hoping they work, you can see exactly how Taquito operations flow (transfers, contract calls, staking, bridging) with visual diagrams showing each step.

**For wallet teams**, it's a quick interoperability check. Connect via Beacon or WalletConnect and validate your wallet's UX against real Tezos operations without building a test harness from scratch.

**For the ecosystem**, it lowers the barrier to testnet participation. The more people experimenting on testnets, the healthier those networks are. An unused testnet is a wasted testnet.

We consider this a **public good**. Our goal is to have a deployment ready on every new testnet as it launches.

## 🌐 Live Deployments

| Network               | URL                                        | Description                                      |
| --------------------- | ------------------------------------------ | ------------------------------------------------ |
| **Ushuaianet**        | https://ushuaianet.dapp.taquito.io/        | U025 protocol testnet                            |
| **Shadownet**         | https://shadownet.dapp.taquito.io/         | Long lived testnet                               |
| **Tezlink Shadownet** | https://tezlink-shadownet.dapp.taquito.io/ | Tezos X Michelson Runtime connected to Shadownet |

Ushuaianet uses the public RPC endpoint `https://rpc.ushuaianet.teztnets.com`.

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

### 🌉 **Layer 2 Integration**

- **Etherlink Bridge** - Bridge XTZ between Tezos L1 and Etherlink L2

## 🎨 Key Features

- **📊 Visual Learning** - Interactive diagrams showing operation flows
- **🌍 Multi-Network** - Available across multiple Tezos testnets
- **🔐 Multiple Wallet Connection Methods** - Support for Beacon, WalletConnect, Ledger devices, Web3Auth (social login), and direct private key
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
npm run build:verified # Build and fail if the target network is missing required fixtures
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

### Cloudflare Deployments

Deployments run from `.github/workflows/deploy.yml` into Cloudflare Pages
projects named `taquito-dapp-<network>`. To deploy Ushuaianet, create or verify:

- Cloudflare Pages project: `taquito-dapp-ushuaianet`
- Custom domain: `ushuaianet.dapp.taquito.io`
- GitHub environment: `ushuaianet`
- GitHub environment vars: `RPC_URL=https://rpc.ushuaianet.teztnets.com`,
  `NETWORK_TYPE=ushuaianet`, `NETWORK_NAME=ushuaianet`
- Existing release secrets available to that environment:
  `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `WALLET_PRIVATE_KEY`, `REOWN_PROJECT_ID`,
  `FAUCET_URL`, `TURNSTILE_SITE_KEY`, `SENTRY_DSN`, `WEB3AUTH_CLIENT_ID`

The workflow compiles and originates the test contracts before
`npm run build:verified`, so the first successful Ushuaianet deploy should
write that network's fixture addresses into `src/networks/network-contracts.json`.

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
