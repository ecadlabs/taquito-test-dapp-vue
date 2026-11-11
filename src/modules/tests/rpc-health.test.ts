import assert from "node:assert/strict";
import test from "node:test";

import { formatRpcHealthSummary, probeRpcHealth } from "@/lib/rpcHealth";

test("probeRpcHealth normalizes trailing slashes and extracts block level and chainId", async () => {
  const requestedUrls: string[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    requestedUrls.push(String(input));
    assert.ok(init?.signal instanceof AbortSignal);
    return new Response(
      JSON.stringify({
        level: 42100,
        chain_id: "NetXgbFy27eBoxH",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const result = await probeRpcHealth("https://rpc.shadownet.teztnets.com///", {
    fetchImpl: fakeFetch,
  });

  assert.deepEqual(requestedUrls, [
    "https://rpc.shadownet.teztnets.com/chains/main/blocks/head/header",
  ]);
  assert.equal(result.healthy, true);
  assert.equal(result.blockLevel, 42100);
  assert.equal(result.chainId, "NetXgbFy27eBoxH");
  assert.ok(result.durationMs >= 0);
  assert.equal(result.error, null);
});

test("probeRpcHealth rejects invalid or non-http URLs without calling fetch", async () => {
  let called = false;
  const fakeFetch: typeof fetch = async () => {
    called = true;
    return new Response(null, { status: 200 });
  };

  const invalidUrlResult = await probeRpcHealth("not-a-valid-url", {
    fetchImpl: fakeFetch,
  });
  assert.equal(invalidUrlResult.healthy, false);
  assert.equal(invalidUrlResult.blockLevel, null);
  assert.equal(called, false);

  const nonHttpResult = await probeRpcHealth("ftp://example.com", {
    fetchImpl: fakeFetch,
  });
  assert.equal(nonHttpResult.healthy, false);
  assert.equal(called, false);
});

test("probeRpcHealth reports unhealthy when HTTP status is not ok or fetch throws", async () => {
  const http502Fetch: typeof fetch = async () =>
    new Response("Bad Gateway", { status: 502, statusText: "Bad Gateway" });

  const httpResult = await probeRpcHealth(
    "https://rpc.shadownet.teztnets.com",
    {
      fetchImpl: http502Fetch,
    },
  );
  assert.equal(httpResult.healthy, false);
  assert.equal(httpResult.error, "HTTP 502");

  const networkErrorFetch: typeof fetch = async () => {
    throw new Error("Failed to fetch");
  };

  const networkResult = await probeRpcHealth(
    "https://rpc.shadownet.tezlink.nomadic-labs.com",
    {
      fetchImpl: networkErrorFetch,
    },
  );
  assert.equal(networkResult.healthy, false);
  assert.equal(networkResult.error, "Failed to fetch");
});

test("formatRpcHealthSummary returns readable diagnostic status strings", () => {
  assert.equal(
    formatRpcHealthSummary({
      status: "checking",
      durationMs: 0,
      blockLevel: null,
      error: null,
    }),
    "Checking RPC server...",
  );

  assert.equal(
    formatRpcHealthSummary({
      status: "healthy",
      durationMs: 142.4,
      blockLevel: 98765,
      error: null,
    }),
    "RPC healthy (142ms, block #98,765)",
  );

  assert.equal(
    formatRpcHealthSummary({
      status: "unhealthy",
      durationMs: 50,
      blockLevel: null,
      error: "Failed to fetch",
    }),
    "RPC unreachable (Failed to fetch)",
  );
});
