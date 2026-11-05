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

/* Creating a context is the costly probe: ask only when a scene is about to mount, and release the context at once, so it never counts against the browser's cap on live contexts.
   A yes cannot change within a page, so a scene asking again opens no other context. A no may be transient (contexts exhausted for a moment), so the next scene asks again. */
let webgl2Supported = false;

export function supportsWebgl2(): boolean {
  if (webgl2Supported) {
    return true;
  }
  const context = document.createElement("canvas").getContext("webgl2");
  context?.getExtension("WEBGL_lose_context")?.loseContext();
  webgl2Supported = context !== null;
  return webgl2Supported;
}

/* Whether the browser implements WebGL2 at all, answered without a context: enough to prepare a scene that may mount. */
export function implementsWebgl2(): boolean {
  return typeof globalThis.WebGL2RenderingContext === "function";
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
