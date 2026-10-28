export function whenIdle(task: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(task);
    return () => {
      window.cancelIdleCallback(handle);
    };
  }
  const handle = globalThis.setTimeout(task, 1);
  return () => {
    globalThis.clearTimeout(handle);
  };
}
