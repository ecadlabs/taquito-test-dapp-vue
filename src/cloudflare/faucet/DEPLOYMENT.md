# Production Deployment Guide

## Cloudflare Setup for Durable Objects

### 1. Enable Durable Objects

Durable Objects are required for persistent rate limiting. Follow these steps:

```bash
# 1. Set your Cloudflare account ID
npx wrangler config

# 2. Get your account ID from dashboard or:
npx wrangler whoami

# 3. Update wrangler.jsonc with your account ID
# Replace "account_id": "" with your actual account ID
```

### 2. Durable Objects Deployment

```bash
# Deploy with Durable Objects support
npx wrangler deploy

# Verify deployment includes Durable Objects
npx wrangler durable-objects list
```

#### Expected Output:

```
┌─────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────┐
│ Name                            │ Class Name                    │ Asset Hash                                                     │
├─────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ RATE_LIMITER                    │ RateLimiter                   │ abc123def456...                                               │
└─────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

## Pre-Deployment Checklist

### 1. Required Secrets (Set via `npx wrangler secret put`)

```bash
# Required secrets
npx wrangler secret put FAUCET_PRIVATE_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY

# Optional secrets
npx wrangler secret put MAX_BALANCE
```

### 2. Environment Variables

Update `wrangler.jsonc` with production values:

```jsonc
{
  "vars": {
    "ALLOWED_ORIGINS": "ghostnet.dapp.taquito.io,seoulnet.dapp.taquito.io,shadownet.dapp.taquito.io",
    "RPC_URL": "https://ghostnet.tezos.ecadinfra.com", // Default if user doesn't provide an RPC URL
    "ALLOWED_RPC_URLS": "https://ghostnet.tezos.ecadinfra.com,https://shadownet.tezos.ecadinfra.com,https://seoulnet.tezos.ecadinfra.com",
    "MIN_TEZ": "1",
    "MAX_TEZ": "10",
    "RATE_LIMIT_ENABLED": "true",
    "RATE_LIMIT_WINDOW": "3600",
    "RATE_LIMIT_MAX_REQUESTS": "5",
  },
}
```

## Deployment Commands

### Development/Testing

```bash
# Install dependencies
cd src/cloudflare/faucet
npm install

# Run locally (place env vars in .dev.vars)
npx wrangler dev
```

### Production Deployment

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Deploy to preview environment
npx wrangler deploy --env preview
```

## Durable Objects Management

### Rate Limiting via Durable Objects

The faucet uses Durable Objects for persistent rate limiting across requests.

#### Rate Limiting Configuration

```jsonc
{
  "vars": {
    "RATE_LIMIT_ENABLED": "true",
    "RATE_LIMIT_WINDOW": "3600", // 1 hour in seconds
    "RATE_LIMIT_MAX_REQUESTS": "10", // Max requests per window per IP
  },
}
```
