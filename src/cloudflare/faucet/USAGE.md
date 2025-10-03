# Tezos Faucet API - Quick Reference

## Base URL

```
https://taquito-playground-faucet.ops-taquito-cloudflare.workers.dev
```

## Endpoints

### POST /fund

**Purpose**: Request Tez from the faucet

**Request Body**:

```json
{
  "address": "tz1...", // Required: Tezos address to send Tez to
  "amount": 5, // Required: Amount in Tez (integer)
  "captchaToken": "token_here", // Required: Turnstile token
  "rpc": "https://..." // Optional: Custom RPC endpoint
}
```

**Response Success**:

```json
{
  "txHash": "onkK..."
}
```

## Error Codes

- `INVALID_ADDRESS`: Wrong Tezos address format
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_CAPTCHA`: Failed Turnstile verification
- `INVALID_RPC`: RPC endpoint not allowed

## Quick Integration Example

```javascript
// Request Tez
const response = await fetch("/fund", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    address: "tz1...",
    amount: 5,
    captchaToken: "turnstile_token",
    rpc: "https://ghostnet.tezos.ecadinfra.com", // optional
  }),
});

const result = await response.json();
console.log("Transaction:", result.txHash);
```

## Supported Networks

- **Ghostnet**: `https://ghostnet.tezos.ecadinfra.com`
- **Shadownet**: `https://shadownet.tezos.ecadinfra.com`
- **Seoulnet**: `https://seoulnet.tezos.ecadinfra.com`
