import "../src/styles/globals.css";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { afterIdle, BoxStage, stageAt } from "./support/box-stage.tsx";
import { DESKTOP } from "./support/viewports.ts";

/* The WebGL2 answer is kept for the page, and this file has a page of its own: the stub goes in before anything asks. */
const getContext = vi.fn<(kind: string) => null>(() => null);

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(getContext);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Stage without WebGL2", () => {
  it("keeps the named poster and creates no canvas", async () => {
    await page.viewport(DESKTOP.width, DESKTOP.height);
    const screen = await render(<BoxStage name="Flat box" />);

    await afterIdle();

    expect(getContext).toHaveBeenCalledExactlyOnceWith("webgl2");
    await expect.element(screen.getByRole("img", { name: "Flat box" })).toBeVisible();
    expect(screen.container.querySelector("canvas")).toBeNull();
    expect(stageAt(screen.container).dataset["stage"]).toBe("poster");
  });
});
