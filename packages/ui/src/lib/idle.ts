/* A busy page may never go idle; the deferred work still runs by this deadline. */
const IDLE_DEADLINE_MS = 2000;

/* Runs the task once the browser is idle. A browser without idle callbacks (Safari) runs it in the next task instead: there, "idle" means right after the caller's effect, after hydration, not once the page has settled. */
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
