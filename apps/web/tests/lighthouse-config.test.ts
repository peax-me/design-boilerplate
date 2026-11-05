import { describe, expect, it } from "vitest";

import { routes } from "../e2e/support/routes";
import desktop from "../lighthouserc.desktop.json";
import mobile from "../lighthouserc.json";

const expectedUrls = routes.map((route) => `http://localhost:3200${route}`);

describe("Lighthouse configuration", () => {
  it.each([
    ["mobile", mobile],
    ["desktop", desktop],
  ])("audits every e2e route on %s", (_formFactor, config) => {
    expect(config.ci.collect.url).toEqual(expectedUrls);
  });

  it("audits desktop with the desktop preset", () => {
    expect(desktop.ci.collect.settings.preset).toBe("desktop");
  });

  it("judges the median run of three, not the best one", () => {
    expect(mobile.ci.assert.aggregationMethod).toBe("median-run");
  });

  it("holds the same budgets on mobile and desktop", () => {
    expect(desktop.ci.assert).toEqual(mobile.ci.assert);
  });

  it("writes each form factor to its own report folder", () => {
    expect(mobile.ci.upload.outputDir).toBe(".lighthouseci/mobile");
    expect(desktop.ci.upload.outputDir).toBe(".lighthouseci/desktop");
  });
});
