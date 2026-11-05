import { afterEach, describe, expect, it, vi } from "vitest";

import { type DeviceProfile, pixelRatio, tierFor } from "../src/lib/quality-tier.ts";

const capableDesktop: DeviceProfile = {
  reducedMotion: false,
  narrow: false,
  coarsePointer: false,
};

interface DeviceSignals {
  matchingQueries?: readonly string[];
  webgl2?: boolean;
}

/* The unit project runs in node: the window and the document are stubbed down to what the lib reads. */
function stubDevice({ matchingQueries = [], webgl2 = true }: DeviceSignals = {}) {
  const createElement = vi.fn<(tag: string) => { getContext: (kind: string) => object | null }>(
    (tag) => ({
      getContext: (kind) => (tag === "canvas" && kind === "webgl2" && webgl2 ? {} : null),
    }),
  );
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({ matches: matchingQueries.includes(query) }),
  });
  vi.stubGlobal("document", { createElement });
  return createElement;
}

/* The WebGL2 answer is kept for the page: every test loads its own copy of the module. */
function freshQualityTier() {
  vi.resetModules();
  return import("../src/lib/quality-tier.ts");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tierFor", () => {
  it("gives no tier under reduced motion", () => {
    expect(tierFor({ ...capableDesktop, reducedMotion: true })).toBeNull();
  });

  it("gives the light tier on a narrow screen", () => {
    expect(tierFor({ ...capableDesktop, narrow: true })).toBe("light");
  });

  it("gives the light tier on a coarse pointer", () => {
    expect(tierFor({ ...capableDesktop, coarsePointer: true })).toBe("light");
  });

  it("gives the full tier to a capable desktop", () => {
    expect(tierFor(capableDesktop)).toBe("full");
  });
});

describe("readDeviceProfile", () => {
  it("reads a phone: narrow, coarse pointer, reduced motion", async () => {
    stubDevice({ matchingQueries: ["(prefers-reduced-motion: reduce)", "(pointer: coarse)"] });
    const { readDeviceProfile } = await freshQualityTier();

    expect(readDeviceProfile()).toStrictEqual({
      reducedMotion: true,
      narrow: true,
      coarsePointer: true,
    });
  });

  it("reads a desktop: wide, fine pointer, motion allowed", async () => {
    stubDevice({ matchingQueries: ["(min-width: 48rem)"] });
    const { readDeviceProfile } = await freshQualityTier();

    expect(readDeviceProfile()).toStrictEqual(capableDesktop);
  });

  it("creates no WebGL context: only the scene about to mount pays for one", async () => {
    const createElement = stubDevice();
    const { readDeviceProfile } = await freshQualityTier();

    readDeviceProfile();

    expect(createElement).not.toHaveBeenCalled();
  });
});

describe("supportsWebgl2", () => {
  it.each([true, false])("answers %s once per page, however many scenes ask", async (webgl2) => {
    const createElement = stubDevice({ webgl2 });
    const { supportsWebgl2 } = await freshQualityTier();

    const answers = [supportsWebgl2(), supportsWebgl2(), supportsWebgl2()];

    expect(answers).toStrictEqual([webgl2, webgl2, webgl2]);
    expect(createElement).toHaveBeenCalledTimes(1);
  });
});

describe("implementsWebgl2", () => {
  it("answers from the API alone, without creating a context", async () => {
    const createElement = stubDevice();
    vi.stubGlobal("WebGL2RenderingContext", vi.fn<() => void>());
    const { implementsWebgl2 } = await freshQualityTier();

    expect(implementsWebgl2()).toBe(true);
    expect(createElement).not.toHaveBeenCalled();
  });

  it("answers no where the browser lacks the API", async () => {
    stubDevice();
    vi.stubGlobal("WebGL2RenderingContext", null);
    const { implementsWebgl2 } = await freshQualityTier();

    expect(implementsWebgl2()).toBe(false);
  });
});

describe("pixelRatio", () => {
  it("caps the light tier lower than the full tier", () => {
    expect(pixelRatio).toStrictEqual({ light: [1, 1.5], full: [1, 2] });
  });
});
