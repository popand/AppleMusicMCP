// CRITICAL: In MCP stdio transport, stdout is reserved for JSON-RPC messages.
// ALL logging MUST go to stderr.

export const logger = {
  info: (message: string, ...args: unknown[]) =>
    console.error(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) =>
    console.error(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) =>
    console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.DEBUG) {
      console.error(`[DEBUG] ${message}`, ...args);
    }
  },
};
