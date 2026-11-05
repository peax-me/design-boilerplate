import { vi } from "vitest";

/* Keeps the page's idle callbacks until the returned function runs them. */
export function holdIdleCallbacks(): () => void {
  const held: IdleRequestCallback[] = [];
  vi.spyOn(window, "requestIdleCallback").mockImplementation((task) => held.push(task));
  return () => {
    for (const task of held.splice(0)) {
      task({ didTimeout: false, timeRemaining: () => 0 });
    }
  };
}
