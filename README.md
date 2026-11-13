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

| Network        | URL                                 | Description           |
| -------------- | ----------------------------------- | --------------------- |
| **Ushuaianet** | https://ushuaianet.dapp.taquito.io/ | U025 protocol testnet |
| **Shadownet**  | https://shadownet.dapp.taquito.io/  | Long lived testnet    |

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

- **Node.js** 24+ (LTS)
- **npm**
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
npm run test:guardrails # Run configuration guardrails

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

### RPC and Test Wallets

The dApp should not point at retired ECAD Infra RPC endpoints. Shadownet uses
`https://rpc.shadownet.teztnets.com`, Ushuaianet uses
`https://rpc.ushuaianet.teztnets.com`, and Tezlink Shadownet uses
`https://rpc.shadownet.tezlink.nomadic-labs.com`.

Playwright tests use `TEST_WALLET_PRIVATE_KEY` or `WALLET_PRIVATE_KEY` when
provided. If a disposable key service is needed for local testing, set
`TEST_KEYGEN_URL` explicitly; there is no built-in keygen host.

### WalletConnect Project ID

Beacon pairs WalletConnect wallets, such as Kukai Mobile, through Reown, and
needs a Reown project ID to do it. Set the dApp's project ID from
[dashboard.reown.com](https://dashboard.reown.com/) as `VITE_REOWN_PROJECT_ID`
in `.env.local`. Deployments get it from the `REOWN_PROJECT_ID` secret.

- **Deploy builds:** `npm run build:verified` fails without it, so production
  never falls back to Beacon's built-in demo project ID. That demo ID is
  deprecated and will be removed in the next Beacon minor release.
- **Local dev:** without it, Beacon uses the demo ID and the page shows a
  banner saying so. Extension and Matrix pairing don't need it.
- **Allowed origins:** the Reown project's allowed origins need to include
  every origin the dApp is served from: the deploy domains, PR preview
  domains, `http://localhost:5173`, and any tunnel you test through.

### Testing Against a Local Kukai

Beacon's pairing modal has Kukai's links hardcoded in `@ecadlabs/beacon-ui`:
the web wallet for each network, the `kukai://` deep link, and the iOS app
link. To send all of them to another Kukai, such as a local build behind a
tunnel, set `KUKAI_URL_OVERRIDE` in `.env.local` and start the dev server:

```bash
# .env.local
KUKAI_URL_OVERRIDE=https://your-kukai.trycloudflare.com/account/tz1...
```

```bash
npm run dev
```

- **Dev server only.** The Vite plugin in `vite-plugins/kukai-link-override.ts`
  rewrites the links while Vite pre-bundles `beacon-ui`. `npm run build` and the
  Cloudflare deployments don't use it, and nothing in `node_modules` is changed.
- **Allowed values:** `https` URLs, or `http` on `localhost`, `127.0.0.1` or
  `[::1]`. No query string or fragment, because Beacon appends `/wc?uri=...` to
  the URL. Trailing slashes are removed. An invalid value stops Vite with an
  error.
- **Every network's Kukai link** gets the same URL, so point it at a Kukai built
  for the network the dApp is running on.
- **To change or remove it,** edit `.env.local` and restart `npm run dev`. Vite
  rebuilds its dependency cache on its own; `--force` isn't needed.
- **While it is on,** the dev server prints the target at startup and the page
  shows a banner with it.
- **Why there is no setting or URL parameter in the app:** either would let
  anyone send a link to the real deployment that opens a fake Kukai.

To reach the dev server through a Cloudflare quick tunnel, allow the tunnel's
host and point `cloudflared` at the dev server:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.trycloudflare.com npm run dev
cloudflared tunnel --url http://localhost:5173
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
