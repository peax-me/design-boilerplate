/* Time for work the browser runs on its own (idle callbacks, observers, a commit reaching the canvas) to settle. */
export const SETTLE_MS = 500;

export function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
