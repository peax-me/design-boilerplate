export type QualityTier = "light" | "full";

export interface DeviceProfile {
  reducedMotion: boolean;
  webgl2: boolean;
  narrow: boolean;
  coarsePointer: boolean;
}

export const pixelRatio: Record<QualityTier, [number, number]> = {
  light: [1, 1.5],
  full: [1, 2],
};

/* No tier means no live scene: the poster stays. */
export function tierFor(profile: DeviceProfile): QualityTier | null {
  if (profile.reducedMotion || !profile.webgl2) {
    return null;
  }
  if (profile.narrow || profile.coarsePointer) {
    return "light";
  }
  return "full";
}

function matches(query: string): boolean {
  return window.matchMedia(query).matches;
}

export function readDeviceProfile(): DeviceProfile {
  return {
    reducedMotion: matches("(prefers-reduced-motion: reduce)"),
    webgl2: document.createElement("canvas").getContext("webgl2") !== null,
    narrow: !matches("(min-width: 48rem)"),
    coarsePointer: matches("(pointer: coarse)"),
  };
}
