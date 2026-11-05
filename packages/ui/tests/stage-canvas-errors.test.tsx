import "../src/styles/globals.css";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import type { SceneProps } from "../src/motion/stage.tsx";
import { StageCanvas } from "../src/scene/stage-canvas.tsx";
import { LIVE_TIMEOUT } from "../stories/support/live-timeout.ts";
import { BoxStage, stageAt } from "./support/box-stage.tsx";
import { DESKTOP } from "./support/viewports.ts";

const frameFailure = new Error("The scene failed while drawing a frame");
const compileFailure = new Error("The scene's shaders failed to compile");

function FailingFrame(): null {
  useFrame(() => {
    throw frameFailure;
  });
  return null;
}

function failToCompile(): never {
  throw compileFailure;
}

function renderFailingFrame({ tier }: SceneProps) {
  return (
    <StageCanvas tier={tier}>
      <FailingFrame />
    </StageCanvas>
  );
}

/* Errors raised by the canvas outside React rendering: in a frame of the ticker, or while compiling the scene's programs. */
const CANVAS_FAILURES = [
  {
    failure: "throws in a frame",
    error: frameFailure,
    renderScene: renderFailingFrame,
  },
  {
    failure: "fails to compile",
    error: compileFailure,
    renderScene: ({ tier }: SceneProps) => (
      <StageCanvas tier={tier}>
        <mesh>
          <boxGeometry />
          <meshBasicMaterial onBeforeCompile={failToCompile} />
        </mesh>
      </StageCanvas>
    ),
  },
];

function silenceConsoleErrors() {
  return vi.spyOn(console, "error").mockImplementation(vi.fn<() => void>());
}

/* React Three Fiber reports an error caught in its own tree as a global error event, the way the browser reports an uncaught one, then hands it to the stage: these reports are expected here. */
function acknowledgeGlobalReports(): void {
  const reported = vi.fn<(event: ErrorEvent) => void>();
  window.addEventListener("error", reported);
  onTestFinished(() => {
    window.removeEventListener("error", reported);
  });
}

beforeEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
  acknowledgeGlobalReports();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Stage canvas errors", () => {
  it.each(CANVAS_FAILURES)(
    "brings the poster back when the scene $failure",
    async ({ error, renderScene }) => {
      const consoleError = silenceConsoleErrors();
      const screen = await render(<BoxStage name="Failing box" renderScene={renderScene} />);
      const stage = stageAt(screen.container);

      await expect
        .poll((): unknown[] => consoleError.mock.calls.flat(), LIVE_TIMEOUT)
        .toContain(error);
      await expect.poll(() => stage.querySelector("canvas")).toBeNull();
      expect(stage.dataset["stage"]).toBe("poster");
      await expect.element(screen.getByRole("img", { name: "Failing box" })).toBeVisible();
    },
  );

  it("keeps the ticker running for the rest of the page when a scene throws in a frame", async () => {
    const consoleError = silenceConsoleErrors();
    await render(<BoxStage name="Failing box" renderScene={renderFailingFrame} />);
    await expect
      .poll((): unknown[] => consoleError.mock.calls.flat(), LIVE_TIMEOUT)
      .toContain(frameFailure);

    const laterWork = vi.fn<() => void>();
    gsap.ticker.add(laterWork);
    onTestFinished(() => {
      gsap.ticker.remove(laterWork);
    });

    await expect.poll(() => laterWork.mock.calls.length).toBeGreaterThan(0);
  });
});
