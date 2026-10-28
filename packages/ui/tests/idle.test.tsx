import { afterEach, describe, expect, it, vi } from "vitest";

import { whenIdle } from "../src/lib/idle.ts";

/* The window is a WebIDL global: requestIdleCallback is an own property of window, not of Window.prototype. */
const idleCallback = Object.getOwnPropertyDescriptor(window, "requestIdleCallback");

function withoutIdleCallbacks(): void {
  Reflect.deleteProperty(window, "requestIdleCallback");
}

afterEach(() => {
  vi.restoreAllMocks();
  if (idleCallback !== undefined) {
    Object.defineProperty(window, "requestIdleCallback", idleCallback);
  }
});

describe("whenIdle", () => {
  it("runs the task once the browser is idle", async () => {
    const task = vi.fn<() => void>();
    whenIdle(task);

    await expect.poll(() => task.mock.calls.length, { timeout: 3000 }).toBe(1);
  });

  it("gives the browser a deadline so a page that never idles still runs the task", () => {
    const requestIdleCallback = vi.spyOn(window, "requestIdleCallback");
    whenIdle(vi.fn<() => void>())();

    expect(requestIdleCallback.mock.lastCall?.[1]?.timeout).toBeGreaterThan(0);
  });

  it("falls back to a timer where idle callbacks do not exist", async () => {
    withoutIdleCallbacks();
    const task = vi.fn<() => void>();
    whenIdle(task);

    expect("requestIdleCallback" in window).toBe(false);
    await expect.poll(() => task.mock.calls.length).toBe(1);
  });

  it("cancels a task that has not run", async () => {
    const task = vi.fn<() => void>();
    whenIdle(task)();
    withoutIdleCallbacks();
    whenIdle(task)();

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(task).not.toHaveBeenCalled();
  });
});
