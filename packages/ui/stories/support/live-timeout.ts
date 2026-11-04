/* The scene loads lazily and its first frame waits for a WebGL context, slower when many browsers share the machine. */
export const LIVE_TIMEOUT = { timeout: 15_000 };
