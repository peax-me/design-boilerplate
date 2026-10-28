import "../src/styles/globals.css";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { IsoBlocks } from "../src/components/iso-blocks.tsx";
import type { Block } from "../src/lib/isometric.ts";

const blocks: Block[] = [
  { id: "near", x: 2, y: 2, z: 0, width: 1, depth: 1, height: 1, material: "lacquer" },
  { id: "far", x: 0, y: 0, z: 0, width: 2, depth: 1, height: 1, material: "maple", label: "13px" },
];

describe("IsoBlocks", () => {
  it("names the drawing and draws far blocks first", async () => {
    const screen = await render(<IsoBlocks blocks={blocks} label="Two blocks" />);

    const drawing = screen.getByRole("img", { name: "Two blocks" }).element();
    const order = [
      ...drawing.querySelectorAll<SVGGElement>(
        "[data-scene-item]:not([data-scene-item$='-label'])",
      ),
    ].map((group) => group.dataset["sceneItem"]);
    expect(order).toEqual(["far", "near"]);
    expect(drawing.querySelectorAll("polygon")).toHaveLength(6);
  });

  it("hides drafts in the final drawing", async () => {
    const screen = await render(
      <IsoBlocks
        blocks={[
          {
            label: "13px",
            id: "draft",
            x: 0,
            y: 0,
            z: 0,
            width: 1,
            depth: 1,
            height: 1,
            material: "lacquer",
            draft: true,
          },
        ]}
        label="Draft"
      />,
    );

    const draft = screen.container.querySelector("[data-scene-item='draft']");
    expect(draft).toHaveClass("opacity-0");
    expect(screen.container.querySelector("[data-scene-item='draft-label']")).toHaveClass(
      "opacity-0",
    );
  });

  it("lays the grain over every face, oriented along each face", async () => {
    const screen = await render(<IsoBlocks blocks={blocks} label="Grained" grain="/grain.webp" />);

    const drawing = screen.getByRole("img", { name: "Grained" }).element();
    await expect.poll(() => drawing.querySelectorAll("pattern image").length).toBe(3);
    expect(drawing.querySelectorAll("polygon")).toHaveLength(12);
  });

  it("writes a block's label above it", async () => {
    const screen = await render(<IsoBlocks blocks={blocks} label="Labelled" />);

    await expect.element(screen.getByText("13px")).toBeInTheDocument();
  });
});
