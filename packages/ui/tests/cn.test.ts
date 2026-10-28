import { describe, expect, it } from "vitest";

import { cn } from "../src/lib/cn.ts";

describe("cn", () => {
  it("keeps the last conflicting spacing utility", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("drops falsy values", () => {
    expect(cn("flex", false, undefined, "gap-4")).toBe("flex gap-4");
  });

  it("treats custom font weights as weights, not families", () => {
    expect(cn("font-sans", "font-regular", "font-semibold")).toBe("font-sans font-semibold");
  });

  it("separates font sizes from text colours", () => {
    expect(cn("text-md", "text-foreground", "text-lg")).toBe("text-foreground text-lg");
  });

  it("resolves custom container widths", () => {
    expect(cn("max-w-default", "max-w-prose")).toBe("max-w-prose");
  });

  it("resolves custom tracking and easing tokens", () => {
    expect(cn("tracking-normal", "tracking-wide", "ease-standard", "ease-emphasized")).toBe(
      "tracking-wide ease-emphasized",
    );
  });
});
