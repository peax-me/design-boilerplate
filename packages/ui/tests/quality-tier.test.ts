import { afterEach, describe, expect, it, vi } from "vitest";

import {
  type DeviceProfile,
  pixelRatio,
  readDeviceProfile,
  tierFor,
} from "../src/lib/quality-tier.ts";

const capableDesktop: DeviceProfile = {
  reducedMotion: false,
  webgl2: true,
  narrow: false,
  coarsePointer: false,
};

interface DeviceSignals {
  matchingQueries: readonly string[];
  webgl2: boolean;
}

/* The unit project runs in node: the window and the document are stubbed down to what the profile reads. */
function stubDevice({ matchingQueries, webgl2 }: DeviceSignals): void {
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({ matches: matchingQueries.includes(query) }),
  });
  vi.stubGlobal("document", {
    createElement: (tag: string) => ({
      getContext: (kind: string) => (tag === "canvas" && kind === "webgl2" && webgl2 ? {} : null),
    }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tierFor", () => {
  it("gives no tier under reduced motion", () => {
    expect(tierFor({ ...capableDesktop, reducedMotion: true })).toBeNull();
  });

  it("gives no tier without WebGL2", () => {
    expect(tierFor({ ...capableDesktop, webgl2: false })).toBeNull();
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
  it("reads a phone: narrow, coarse pointer, reduced motion, no WebGL2", () => {
    stubDevice({
      matchingQueries: ["(prefers-reduced-motion: reduce)", "(pointer: coarse)"],
      webgl2: false,
    });

    expect(readDeviceProfile()).toStrictEqual({
      reducedMotion: true,
      webgl2: false,
      narrow: true,
      coarsePointer: true,
    });
  });

  it("reads a desktop: wide, fine pointer, motion allowed, WebGL2", () => {
    stubDevice({ matchingQueries: ["(min-width: 48rem)"], webgl2: true });

    expect(readDeviceProfile()).toStrictEqual(capableDesktop);
  });
});

describe("pixelRatio", () => {
  it("caps the light tier lower than the full tier", () => {
    expect(pixelRatio).toStrictEqual({ light: [1, 1.5], full: [1, 2] });
  });
});
