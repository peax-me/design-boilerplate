import "../src/styles/globals.css";
import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { Grid } from "../src/layout/grid.tsx";
import { Stat } from "../src/typography/stat.tsx";

beforeEach(async () => {
  await page.viewport(1280, 800);
});

describe("Stat", () => {
  it("keeps figures on one line when a label in the row wraps", async () => {
    const screen = await render(
      <Grid as="dl" columns="4">
        <Stat value="95+" label="Short label" />
        <Stat value="100" label="A label long enough to wrap onto a second line in its column" />
      </Grid>,
    );

    const short = screen.getByText("95+").element().getBoundingClientRect();
    const long = screen.getByText("100").element().getBoundingClientRect();
    expect(long.top).toBe(short.top);
  });
});
