/// <reference types="@cloudflare/workers-types" />

export interface FaucetRequest {
  address: string;
  amount: number;
  rpc?: string; // Optional RPC URL parameter
}

export interface FaucetResponse {
  txHash: string;
}

export interface TurnstileResponse {
  success: boolean;
  "error-codes": string[];
  challenge_ts: string;
  hostname: string;
  action: string;
  cdata: string;
}

export interface Env {
  ALLOWED_ORIGINS: string;
  FAUCET_PRIVATE_KEY: string;
  RPC_URL: string; // Default RPC URL
  TURNSTILE_SECRET_KEY: string;
  MAX_BALANCE?: string;
  MIN_TEZ?: string;
  MAX_TEZ?: string;
  RATE_LIMIT_ENABLED?: string;
  RATE_LIMIT_WINDOW?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  ALLOWED_RPC_URLS?: string; // Comma-separated list of allowed RPC URLs
  RATE_LIMITER: DurableObjectNamespace; // Durable Object binding for rate limiting
}
