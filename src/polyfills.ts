import { Buffer } from "buffer";
import process from "process/browser";

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

  var Buffer: BufferConstructor;
  var process: NodeJS.Process;
}

// Ensure process.env exists
if (!process.env) {
  process.env = {};
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

// Provide a minimal require() stub for CommonJS modules
// This is needed for @taquito/sapling which uses require() for parameter files
if (typeof globalThis.require === "undefined") {
  // @ts-expect-error - Adding require stub for browser compatibility
  globalThis.require = (id: string) => {
    console.warn(
      `require('${id}') called - returning empty object (module not available in browser)`,
    );
    return {};
  };
}

// Export them so they can be imported directly
export { Buffer, process };
