import { afterEach, describe, expect, it, vi } from "vitest";

import { type DeviceProfile, pixelRatio, tierFor } from "../src/lib/quality-tier.ts";

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
function stubDevice({ matchingQueries, webgl2 }: DeviceSignals) {
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
async function freshReadDeviceProfile(): Promise<() => DeviceProfile> {
  vi.resetModules();
  const { readDeviceProfile } = await import("../src/lib/quality-tier.ts");
  return readDeviceProfile;
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
  it("reads a phone: narrow, coarse pointer, reduced motion, no WebGL2", async () => {
    stubDevice({
      matchingQueries: ["(prefers-reduced-motion: reduce)", "(pointer: coarse)"],
      webgl2: false,
    });
    const readDeviceProfile = await freshReadDeviceProfile();

    expect(readDeviceProfile()).toStrictEqual({
      reducedMotion: true,
      webgl2: false,
      narrow: true,
      coarsePointer: true,
    });
  });

  it("reads a desktop: wide, fine pointer, motion allowed, WebGL2", async () => {
    stubDevice({ matchingQueries: ["(min-width: 48rem)"], webgl2: true });
    const readDeviceProfile = await freshReadDeviceProfile();

    expect(readDeviceProfile()).toStrictEqual(capableDesktop);
  });

  it.each([true, false])(
    "probes WebGL2 once per page when the answer is %s, however many scenes ask",
    async (webgl2) => {
      const createElement = stubDevice({ matchingQueries: [], webgl2 });
      const readDeviceProfile = await freshReadDeviceProfile();

      const answers = [readDeviceProfile(), readDeviceProfile(), readDeviceProfile()];

      expect(answers.map((profile) => profile.webgl2)).toStrictEqual([webgl2, webgl2, webgl2]);
      expect(createElement).toHaveBeenCalledTimes(1);
    },
  );
});

describe("pixelRatio", () => {
  it("caps the light tier lower than the full tier", () => {
    expect(pixelRatio).toStrictEqual({ light: [1, 1.5], full: [1, 2] });
  });
});
