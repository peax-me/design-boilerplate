import "../src/styles/globals.css";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { type Locator, page } from "vitest/browser";

import { TokenTray } from "../src/components/token-tray.tsx";
import { presetGroups } from "../src/theme/presets.ts";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";

async function pick(radio: Locator): Promise<void> {
  const piece = radio.element().closest("label");
  if (piece === null) {
    throw new Error("A tray piece wraps every radio");
  }
  await page.elementLocator(piece).click();
}

afterEach(async () => {
  await allowMotion();
  for (const group of presetGroups) {
    document.documentElement.removeAttribute(group.attribute);
  }
});

describe("TokenTray", () => {
  it("offers every preset group with its default piece selected", async () => {
    const screen = await render(<TokenTray />);

    await Promise.all(
      presetGroups.map(async (group) => {
        await expect.element(screen.getByRole("radiogroup", { name: group.name })).toBeVisible();
      }),
    );
    await expect.element(screen.getByRole("radio", { name: "Yellow paint" })).toBeChecked();
  });

  it("puts the chosen piece on the page", async () => {
    await preferReducedMotion();
    const screen = await render(<TokenTray />);

    await pick(screen.getByRole("radio", { name: "Green paint" }));

    expect(document.documentElement.dataset["paint"]).toBe("green");
    await expect.element(screen.getByRole("radio", { name: "Green paint" })).toBeChecked();
  });

  it("swaps the piece inside a view transition when motion is allowed", async () => {
    const screen = await render(<TokenTray />);

    await pick(screen.getByRole("radio", { name: "Slab face" }));

    await expect.poll(() => document.documentElement.dataset["face"]).toBe("slab");
  });

  it("keeps several trays in step", async () => {
    await preferReducedMotion();
    const screen = await render(
      <>
        <TokenTray aria-label="First tray" />
        <TokenTray aria-label="Second tray" />
      </>,
    );

    await pick(
      screen
        .getByRole("group", { name: "First tray" })
        .getByRole("radio", { name: "Roomy module" }),
    );

    expect(document.documentElement.dataset["module"]).toBe("roomy");
    await expect
      .element(
        screen
          .getByRole("group", { name: "Second tray" })
          .getByRole("radio", { name: "Roomy module" }),
      )
      .toBeChecked();
  });
});
