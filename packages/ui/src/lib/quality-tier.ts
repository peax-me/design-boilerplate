export type QualityTier = "light" | "full";

export interface DeviceProfile {
  reducedMotion: boolean;
  narrow: boolean;
  coarsePointer: boolean;
}

export const pixelRatio: Record<QualityTier, [number, number]> = {
  light: [1, 1.5],
  full: [1, 2],
};

/* No tier means no live scene: the poster stays. */
export function tierFor(profile: DeviceProfile): QualityTier | null {
  if (profile.reducedMotion) {
    return null;
  }
  if (profile.narrow || profile.coarsePointer) {
    return "light";
  }
  return "full";
}

/* Creating a context is the costly probe: ask only when a scene is about to mount. The answer cannot change within a page, so a scene asking again must not open another context. */
let webgl2Supported: boolean | undefined;

export function supportsWebgl2(): boolean {
  webgl2Supported ??= document.createElement("canvas").getContext("webgl2") !== null;
  return webgl2Supported;
}

function matches(query: string): boolean {
  return window.matchMedia(query).matches;
}

export function readDeviceProfile(): DeviceProfile {
  return {
    reducedMotion: matches("(prefers-reduced-motion: reduce)"),
    narrow: !matches("(min-width: 48rem)"),
    coarsePointer: matches("(pointer: coarse)"),
  };
}
