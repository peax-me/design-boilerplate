import { afterEach, describe, expect, it, vi } from "vitest";

import { whenIdle } from "../src/lib/idle.ts";

const idleCallback = Object.getOwnPropertyDescriptor(Window.prototype, "requestIdleCallback");

function withoutIdleCallbacks(): void {
  Reflect.deleteProperty(Window.prototype, "requestIdleCallback");
}

afterEach(() => {
  if (idleCallback !== undefined) {
    Object.defineProperty(Window.prototype, "requestIdleCallback", idleCallback);
  }
});

describe("whenIdle", () => {
  it("runs the task once the browser is idle", async () => {
    const task = vi.fn<() => void>();
    whenIdle(task);

    await expect.poll(() => task.mock.calls.length).toBe(1);
  });

  it("falls back to a timer where idle callbacks do not exist", async () => {
    withoutIdleCallbacks();
    const task = vi.fn<() => void>();
    whenIdle(task);

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
