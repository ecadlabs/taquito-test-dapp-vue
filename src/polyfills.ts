import { Buffer } from "buffer";
import process from "process";
import stream from "stream";
import transform from "stream";

// Make Buffer and process available globally
(globalThis as Record<string, unknown>).Buffer = Buffer;
(globalThis as Record<string, unknown>).process = process;
(globalThis as Record<string, unknown>).stream = stream;
(globalThis as Record<string, unknown>).transform = transform;
