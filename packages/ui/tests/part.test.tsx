import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Part } from "../src/typography/part.tsx";

describe("Part", () => {
  it("pairs a counted piece with its name", async () => {
    const screen = await render(
      <dl>
        <Part count={96} label="design tokens" piece={<svg />} />
      </dl>,
    );

    await expect.element(screen.getByRole("term")).toHaveTextContent("design tokens");
    await expect.element(screen.getByRole("definition")).toHaveTextContent("×96");
  });
});
