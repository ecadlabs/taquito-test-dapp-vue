import { Buffer } from "buffer";
import process from "process";

// Extend global interfaces to include Node.js globals
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
    global: typeof globalThis;
  }

  interface GlobalThis {
    Buffer: typeof Buffer;
    process: typeof process;
    global: typeof globalThis;
  }
}

// Make Buffer and process available globally
if (typeof globalThis !== "undefined") {
  globalThis.Buffer = Buffer;
  globalThis.process = process;
  globalThis.global = globalThis;
}

// Also make them available on window for browser compatibility
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
  window.process = process;
  window.global = globalThis;
}

// Export them so they can be imported directly
export { Buffer, process };
