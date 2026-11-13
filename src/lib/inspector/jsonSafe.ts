import type { InspectorEntry, JsonValue } from "./types";

export interface JsonSafeOptions {
  /** Nesting depth after which values are replaced with `"[MaxDepth]"`. */
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 10;

/**
 * Plain and encrypted secret keys for ed25519, secp256k1, p256, and BLS. The
 * shortest (unencrypted 32-byte seeds) carry 50 base58 characters after the
 * prefix; longer forms are matched by the open upper bound.
 */
const SECRET_KEY_PATTERN =
  /\b(?:edsk|spsk|p2sk|BLsk|edesk|spesk|p2esk|BLesk)[1-9A-HJ-NP-Za-km-z]{50,}/g;

export const redactSecrets = (text: string): string =>
  text.replace(SECRET_KEY_PATTERN, "[redacted secret key]");

const isThenable = (value: object): boolean =>
  "then" in value && typeof value.then === "function";

/**
 * Converts an arbitrary SDK payload into a JSON-safe snapshot.
 *
 * Functions become `"[Function]"`, thenables `"[Promise]"`, bigints decimal
 * strings, references back to an ancestor `"[Circular]"`. Tezos secret keys
 * found in any string are replaced with `"[redacted secret key]"`.
 */
export const toJsonSafe = (
  value: unknown,
  options: JsonSafeOptions = {},
): JsonValue => {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const ancestors = new Set<object>();

  const convert = (input: unknown, depth: number): JsonValue | undefined => {
    switch (typeof input) {
      case "undefined":
        return undefined;
      case "string":
        return redactSecrets(input);
      case "number":
        return Number.isFinite(input) ? input : String(input);
      case "boolean":
        return input;
      case "bigint":
        return input.toString();
      case "symbol":
        return input.toString();
      case "function":
        return "[Function]";
    }

    if (input === null) return null;
    if (typeof input !== "object") return String(input);
    if (isThenable(input)) return "[Promise]";
    if (ancestors.has(input)) return "[Circular]";
    if (depth >= maxDepth) return "[MaxDepth]";

    if (input instanceof Date) return input.toISOString();
    if (ArrayBuffer.isView(input)) {
      return `[${input.constructor.name} ${input.byteLength} bytes]`;
    }

    ancestors.add(input);
    try {
      if (Array.isArray(input) || input instanceof Set) {
        return Array.from(input, (item) => convert(item, depth + 1) ?? null);
      }
      if (input instanceof Map) {
        return Array.from(input, ([key, item]) => [
          convert(key, depth + 1) ?? null,
          convert(item, depth + 1) ?? null,
        ]);
      }

      const result: { [key: string]: JsonValue } = {};
      if (input instanceof Error) {
        result.name = input.name;
        result.message = redactSecrets(input.message);
      }
      for (const [key, item] of Object.entries(input)) {
        const converted = convert(item, depth + 1);
        if (converted !== undefined) result[key] = converted;
      }
      return result;
    } finally {
      ancestors.delete(input);
    }
  };

  return convert(value, 0) ?? null;
};

/** Serializes entries as JSON Lines, one entry per line, for export. */
export const toJsonl = (entries: readonly InspectorEntry[]): string =>
  entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n";
