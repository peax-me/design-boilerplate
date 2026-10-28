import "../src/styles/globals.css";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { PairedLayers } from "../src/layout/paired-layers.tsx";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";

const items = ["Tokens", "Lint", "Audit"].map((title) => ({
  id: title,
  aside: <p>{`${title} step`}</p>,
  panel: <p>{`${title} panel`}</p>,
}));

beforeEach(async () => {
  await page.viewport(1280, 800);
});

afterEach(async () => {
  await allowMotion();
});

describe("PairedLayers", () => {
  it("places each aside beside its own panel without motion", async () => {
    await preferReducedMotion();
    const screen = await render(<PairedLayers items={items} />);

    const aside = screen.getByText("Lint step").element().getBoundingClientRect();
    const panel = screen.getByText("Lint panel").element().getBoundingClientRect();
    expect(panel.left).toBeGreaterThanOrEqual(aside.right);
    expect(panel.top).toBe(aside.top);
  });

  it("stacks every panel in one cell with motion", async () => {
    const screen = await render(<PairedLayers items={items} />);

    const first = screen.getByText("Tokens panel").element().getBoundingClientRect();
    const last = screen.getByText("Audit panel").element().getBoundingClientRect();
    expect(last.top).toBe(first.top);
    expect(last.left).toBe(first.left);
  });
});
