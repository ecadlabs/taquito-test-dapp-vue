import { importKey } from "@taquito/signer";
import { TezosToolkit } from "@taquito/taquito";
import { RateLimiter } from "./RateLimiter";
import type {
  Env,
  FaucetRequest,
  FaucetResponse,
  TurnstileResponse,
} from "./types";

// Export the Durable Object class separately
export { RateLimiter };

function addCorsHeaders(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin || "*");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        const origin = request.headers.get("Origin");

        if (!isOriginAllowed(origin, env)) {
          return new Response("Forbidden", { status: 403 });
        }

        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": origin!,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
          },
        });
      }

      // Handle faucet funding
      if (path === "/fund") {
        return await handleFund(request, env);
      }

      // 404 for other paths
      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

async function handleFund(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin");

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "POST",
        "Access-Control-Allow-Origin": origin || "*",
      },
    });
  }

  if (!isOriginAllowed(origin, env)) {
    return addCorsHeaders(new Response("Forbidden", { status: 403 }), origin);
  }

  // Rate limiting check
  const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  if (await isRateExceeded(clientIP, env)) {
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
      origin,
    );
  }

  try {
    const body: FaucetRequest & { captchaToken: string } = await request.json();
    const { address, amount, captchaToken, rpc } = body;

    // Validate input
    if (!address || !amount || !captchaToken) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            error:
              "Missing required fields: address, amount, and captchaToken are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
        origin,
      );
    }

    // Validate RPC URL if provided
    const selectedRpcUrl = await validateAndSelectRpcUrl(rpc, env);
    if (!selectedRpcUrl) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            error:
              "Invalid or not allowed RPC URL. Please use a supported RPC endpoint.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
        origin,
      );
    }

    // Validate Tezos address format
    if (
      !address.startsWith("tz1") &&
      !address.startsWith("tz2") &&
      !address.startsWith("tz3") &&
      !address.startsWith("tz4")
    ) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: "Invalid Tezos address format" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
        origin,
      );
    }

    // Validate amount
    const minTez = env.MIN_TEZ ? parseInt(env.MIN_TEZ) : 1;
    const maxTez = env.MAX_TEZ ? parseInt(env.MAX_TEZ) : 10;

    if (
      amount < minTez ||
      amount > maxTez ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            error: `Amount must be an integer between ${minTez} and ${maxTez} tez`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
        origin,
      );
    }

    // Verify Turnstile captcha
    const captchaValid = await verifyTurnstileCaptcha(captchaToken, env);
    if (!captchaValid) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: "Invalid captcha" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
        origin,
      );
    }

    // Check recipient balance if maxBalance is set
    if (env.MAX_BALANCE) {
      const maxBalance = parseInt(env.MAX_BALANCE);
      const recipientBalance = await getAccountBalance(address, selectedRpcUrl);
      if (recipientBalance >= maxBalance) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              error: `Recipient balance exceeds maximum allowed (${maxBalance} tez`,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          ),
          origin,
        );
      }
    }

    // Send tez
    const txHash = await sendTez(address, amount, selectedRpcUrl, env);

    const response: FaucetResponse = { txHash };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin!,
      },
    });
  } catch (error) {
    console.error("Fund error:", error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ error: "Failed to process funding request" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
      origin,
    );
  }
}

async function verifyTurnstileCaptcha(
  token: string,
  env: Env,
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      },
    );

    const result: TurnstileResponse = await response.json();
    return result.success;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
}

async function getAccountBalance(
  address: string,
  rpcUrl: string,
): Promise<number> {
  const tezos = new TezosToolkit(rpcUrl);
  const balance = await tezos.tz.getBalance(address);
  return parseInt(balance.toString()) / 1_000_000; // Convert from mutez to tez
}

async function sendTez(
  address: string,
  amount: number,
  rpcUrl: string,
  env: Env,
): Promise<string> {
  const tezos = new TezosToolkit(rpcUrl);

  // Set reasonable timeout
  tezos.setProvider({
    rpc: rpcUrl,
    config: {
      confirmationPollingTimeoutSecond: 300, // 5 minutes timeout
      defaultConfirmationCount: 1,
    },
  });

  await importKey(tezos, env.FAUCET_PRIVATE_KEY);

  try {
    const op = await tezos.wallet.transfer({
      to: address,
      amount: amount,
    });

    const operation = await op.send();
    await operation.confirmation(1);

    return operation.opHash;
  } catch (error) {
    console.error("Tezos operation failed:", error);
    throw new Error("Failed to send transaction");
  }
}

async function isRateExceeded(clientIP: string, env: Env): Promise<boolean> {
  if (env.RATE_LIMIT_ENABLED !== "true") return false;

  try {
    // Get the durable object instance for this IP
    const id = env.RATE_LIMITER.idFromName(clientIP);
    const durableObject = env.RATE_LIMITER.get(id);

    const windowSeconds = parseInt(env.RATE_LIMIT_WINDOW || "3600");
    const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS || "10");

    // Check rate limit via durable object
    const response = await durableObject.fetch(
      "https://internal/internal?action=check",
      {
        method: "POST",
        body: JSON.stringify({
          clientIP,
          windowSeconds,
          maxRequests,
        }),
      },
    );

    const result = (await response.json()) as { allowed?: boolean };
    return !result.allowed;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if check fails
    return false;
  }
}

async function validateAndSelectRpcUrl(
  rpcUrl: string | undefined,
  env: Env,
): Promise<string | null> {
  if (!rpcUrl) {
    return env.RPC_URL; // Use default if not provided
  }

  // Check if the provided RPC URL is in the allowed list
  if (env.ALLOWED_RPC_URLS) {
    const allowedUrls = env.ALLOWED_RPC_URLS.split(",").map((url: string) =>
      url.trim(),
    );
    if (!allowedUrls.includes(rpcUrl)) {
      console.warn(`RPC URL not allowed: ${rpcUrl}`);
      return null;
    }
  }

  // Validate URL format
  try {
    new URL(rpcUrl);
    if (!rpcUrl.startsWith("http://") && !rpcUrl.startsWith("https://")) {
      return null;
    }
  } catch {
    console.warn(`Invalid RPC URL format: ${rpcUrl}`);
    return null;
  }

  // Test RPC endpoint connectivity
  try {
    const tezos = new TezosToolkit(rpcUrl);
    await tezos.rpc.getChainId(); // Simple connectivity test
    return rpcUrl;
  } catch (error) {
    console.error(`RPC URL connectivity test failed for ${rpcUrl}:`, error);
    return null;
  }
}

function isOriginAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return false;

  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o: string) =>
    o.trim(),
  );
  return allowedOrigins.includes("*") || allowedOrigins.includes(origin);
}
