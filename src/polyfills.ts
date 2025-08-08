import { Buffer } from 'buffer';

// Make Buffer available globally
(globalThis as Record<string, unknown>).Buffer = Buffer;
