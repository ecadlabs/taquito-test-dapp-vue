export type RpcHealthStatus = "checking" | "healthy" | "unhealthy";

export interface RpcHealthResult {
  healthy: boolean;
  durationMs: number;
  blockLevel: number | null;
  chainId: string | null;
  error: string | null;
}

export interface ProbeRpcHealthOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export const probeRpcHealth = async (
  url: string,
  options: ProbeRpcHealthOptions = {},
): Promise<RpcHealthResult> => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10000;

  let normalizedBaseUrl: string;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        healthy: false,
        durationMs: 0,
        blockLevel: null,
        chainId: null,
        error: "Unsupported protocol",
      };
    }
    normalizedBaseUrl = parsed.toString().replace(/\/+$/, "");
  } catch {
    return {
      healthy: false,
      durationMs: 0,
      blockLevel: null,
      chainId: null,
      error: "Invalid URL",
    };
  }

  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(
      `${normalizedBaseUrl}/chains/main/blocks/head/header`,
      {
        method: "GET",
        signal: controller.signal,
      },
    );
    const durationMs = performance.now() - startTime;

    if (!response.ok) {
      return {
        healthy: false,
        durationMs,
        blockLevel: null,
        chainId: null,
        error: `HTTP ${response.status}`,
      };
    }

    let blockLevel: number | null = null;
    let chainId: string | null = null;
    try {
      const payload = (await response.json()) as Record<string, unknown>;
      if (typeof payload.level === "number") {
        blockLevel = payload.level;
      }
      if (typeof payload.chain_id === "string") {
        chainId = payload.chain_id;
      }
    } catch {
      // Header endpoint succeeded even if JSON body was omitted by a proxy
    }

    return {
      healthy: true,
      durationMs,
      blockLevel,
      chainId,
      error: null,
    };
  } catch (err) {
    const durationMs = performance.now() - startTime;
    const errorMessage =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Connection failed";

    return {
      healthy: false,
      durationMs,
      blockLevel: null,
      chainId: null,
      error: errorMessage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const formatRpcHealthSummary = (params: {
  status: RpcHealthStatus;
  durationMs: number;
  blockLevel: number | null;
  error: string | null;
}): string => {
  if (params.status === "checking") {
    return "Checking RPC server...";
  }

  if (params.status === "healthy") {
    const details: string[] = [];
    if (params.durationMs > 0) {
      details.push(`${Math.round(params.durationMs)}ms`);
    }
    if (params.blockLevel !== null) {
      details.push(`block #${params.blockLevel.toLocaleString("en-US")}`);
    }
    return details.length > 0
      ? `RPC healthy (${details.join(", ")})`
      : "RPC healthy";
  }

  return params.error ? `RPC unreachable (${params.error})` : "RPC unreachable";
};
