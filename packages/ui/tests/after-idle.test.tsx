import { lazy } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { AfterIdle } from "../src/motion/after-idle.tsx";
import { holdIdleCallbacks } from "./support/idle-callbacks.ts";
import { pause, SETTLE_MS } from "./support/pause.ts";

function Later() {
  return <p>Later</p>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AfterIdle", () => {
  it("renders its children only once the page is idle", async () => {
    const releaseIdleCallbacks = holdIdleCallbacks();
    const screen = await render(
      <AfterIdle>
        <Later />
      </AfterIdle>,
    );

    await pause(SETTLE_MS);
    expect(screen.container.textContent).toBe("");

    releaseIdleCallbacks();
    await expect.element(screen.getByText("Later")).toBeVisible();
  });

  it("loads a lazy child without suspending the page around it", async () => {
    const releaseIdleCallbacks = holdIdleCallbacks();
    const { promise: loaded, resolve: load } = Promise.withResolvers<{ default: typeof Later }>();
    const LazyLater = lazy(() => loaded);
    const screen = await render(
      <>
        <p>Page</p>
        <AfterIdle>
          <LazyLater />
        </AfterIdle>
      </>,
    );

    releaseIdleCallbacks();
    await pause(SETTLE_MS);
    await expect.element(screen.getByText("Page")).toBeVisible();
    expect(screen.container.textContent).toBe("Page");

    load({ default: Later });
    await expect.element(screen.getByText("Later")).toBeVisible();
  });

  it("keeps the page when its lazy child fails to load", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(vi.fn<() => void>());
    const releaseIdleCallbacks = holdIdleCallbacks();
    const chunkLost = new Error("The motion chunk failed to load");
    const LazyLost = lazy(() => Promise.reject(chunkLost));
    const screen = await render(
      <>
        <p>Page</p>
        <AfterIdle>
          <LazyLost />
        </AfterIdle>
      </>,
    );

    releaseIdleCallbacks();
    await expect.poll((): unknown[] => consoleError.mock.calls.flat()).toContain(chunkLost);
    await expect.element(screen.getByText("Page")).toBeVisible();
    expect(screen.container.textContent).toBe("Page");
  });
});
