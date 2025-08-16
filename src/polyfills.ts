import { Buffer } from "buffer";

// Make Buffer and process available globally
(globalThis as Record<string, unknown>).Buffer = Buffer;
