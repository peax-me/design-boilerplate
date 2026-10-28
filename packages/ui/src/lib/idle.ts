/* A busy page may never go idle; the deferred work still runs by this deadline. */
const IDLE_DEADLINE_MS = 2000;

export function whenIdle(task: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(task, { timeout: IDLE_DEADLINE_MS });
    return () => {
      window.cancelIdleCallback(handle);
    };
  }
  const handle = globalThis.setTimeout(task, 1);
  return () => {
    globalThis.clearTimeout(handle);
  };
}
