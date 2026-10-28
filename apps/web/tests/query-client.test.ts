import { environmentManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getQueryClient } from "../src/lib/query-client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getQueryClient", () => {
  it("creates a fresh client per server request", () => {
    expect(getQueryClient()).not.toBe(getQueryClient());
  });

  it("reuses one client in the browser", () => {
    vi.spyOn(environmentManager, "isServer").mockReturnValue(false);

    expect(getQueryClient()).toBe(getQueryClient());
  });
});
