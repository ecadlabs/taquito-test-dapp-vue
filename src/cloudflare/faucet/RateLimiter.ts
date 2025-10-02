import { DurableObject } from "cloudflare:workers";

interface RateLimitRequest {
  clientIP: string;
  windowSeconds: number;
  maxRequests: number;
}

interface ResetRequest {
  clientIP?: string;
}

export class RateLimiter extends DurableObject {
  private rateLimitData: Map<string, number[]> = new Map();
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Record<string, unknown>) {
    super(state, env);
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "check":
        return await this.checkRateLimit(request);
      case "reset":
        return await this.resetRateLimit(request);
      default:
        return new Response("Invalid action", { status: 400 });
    }
  }

  private async checkRateLimit(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as RateLimitRequest;
      const { clientIP, windowSeconds, maxRequests } = body;

      const now = Date.now();
      const windowMs = windowSeconds * 1000;
      const cutoff = now - windowMs;

      // Get existing timestamps for this IP
      const timestamps = this.rateLimitData.get(clientIP) || [];

      // Filter out expired timestamps
      const recentRequests = timestamps.filter(
        (timestamp) => timestamp > cutoff,
      );

      // Check if rate limit exceeded
      if (recentRequests.length >= maxRequests) {
        return new Response(
          JSON.stringify({
            allowed: false,
            remaining: 0,
            resetTime: recentRequests[0] + windowMs,
            message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowSeconds} seconds.`,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Add current request timestamp
      recentRequests.push(now);
      this.rateLimitData.set(clientIP, recentRequests);

      const remaining = Math.max(0, maxRequests - recentRequests.length);
      const resetTime = recentRequests[0] + windowMs;

      return new Response(
        JSON.stringify({
          allowed: true,
          remaining,
          resetTime,
          requests: recentRequests.length,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow request if check fails
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: 1,
          resetTime: Date.now() + 3600 * 1000,
          error: "Rate limit check failed",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  private async resetRateLimit(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as ResetRequest;
      const { clientIP } = body;

      if (clientIP) {
        this.rateLimitData.delete(clientIP);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Rate limit reset for IP ${clientIP}`,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } else {
        // Reset all IPs
        this.rateLimitData.clear();
        return new Response(
          JSON.stringify({
            success: true,
            message: "Rate limit reset for all IPs",
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } catch (error) {
      console.error("Rate limit reset error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to reset rate limit",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Cleanup old data periodically
  async alarm(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [clientIP, timestamps] of this.rateLimitData.entries()) {
      const recentTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < maxAge,
      );
      if (recentTimestamps.length === 0) {
        this.rateLimitData.delete(clientIP);
      } else {
        this.rateLimitData.set(clientIP, recentTimestamps);
      }
    }

    // Schedule next cleanup in 1 hour
    await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
  }
}
