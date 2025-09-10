import { Buffer } from "buffer";
import process from "process";

// Make Buffer and process available globally
if (typeof globalThis !== "undefined") {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).process = process;
  (globalThis as any).global = globalThis;
}

// Also make them available on window for browser compatibility
if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).process = process;
  (window as any).global = globalThis;
}

// Export them so they can be imported directly
export { Buffer, process };
