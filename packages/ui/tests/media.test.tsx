import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Media } from "../src/components/media.tsx";

const pixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("Media", () => {
  it("frames an image with its caption", async () => {
    const screen = await render(
      <Media image={<img src={pixel} alt="A Figma library" />} caption="Synced from code" />,
    );

    await expect.element(screen.getByRole("img", { name: "A Figma library" })).toBeVisible();
    await expect.element(screen.getByRole("figure", { name: "Synced from code" })).toBeVisible();
  });

  it("shows the image alone without a caption", async () => {
    const screen = await render(<Media image={<img src={pixel} alt="Maple grain" />} />);

    expect(screen.container.querySelector("figcaption")).toBeNull();
  });
});
