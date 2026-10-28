export const duration = {
  fast: 0.2,
  base: 0.45,
  slow: 0.8,
} as const;

export const ease = {
  standard: "power2.out",
  emphasized: "expo.out",
  inOut: "power3.inOut",
} as const;

export const stagger = {
  tight: 0.04,
  base: 0.08,
  loose: 0.14,
} as const;

export const sceneLength = {
  short: 1,
  medium: 2,
  long: 3,
} as const;

export const scrub = 0.6;
