import { describe, expect, it } from "vitest";

import { isAdrRecord, isFormattable, isLintable, readEditedFile } from "../src/hook-input.ts";

describe("readEditedFile", () => {
  it("reads the content of a Write", () => {
    const input = { tool_input: { file_path: "/repo/a.ts", content: "const a = 1;" } };
    expect(readEditedFile(input)).toEqual({
      filePath: "/repo/a.ts",
      writtenTexts: ["const a = 1;"],
    });
  });

  it("reads the replacement of an Edit", () => {
    const input = { tool_input: { file_path: "/repo/a.ts", old_string: "a", new_string: "b" } };
    expect(readEditedFile(input)).toEqual({ filePath: "/repo/a.ts", writtenTexts: ["b"] });
  });

  it("reads every replacement of a MultiEdit", () => {
    const input = {
      tool_input: { file_path: "/repo/a.ts", edits: [{ new_string: "b" }, { new_string: "c" }] },
    };
    expect(readEditedFile(input)).toEqual({ filePath: "/repo/a.ts", writtenTexts: ["b", "c"] });
  });

  it("skips malformed MultiEdit entries", () => {
    const input = {
      tool_input: {
        file_path: "/repo/a.ts",
        edits: [{ new_string: "b" }, { old_string: "x" }, "junk"],
      },
    };
    expect(readEditedFile(input)).toEqual({ filePath: "/repo/a.ts", writtenTexts: ["b"] });
  });

  it("ignores payloads without a file path", () => {
    expect(readEditedFile({ tool_input: { command: "ls" } })).toBeUndefined();
    expect(readEditedFile(null)).toBeUndefined();
    expect(readEditedFile({ tool_input: "invalid" })).toBeUndefined();
  });
});

describe("file classification", () => {
  it("recognises ADR records but not the template or index", () => {
    expect(isAdrRecord("/repo/docs/adr/0007-tailwind.md")).toBe(true);
    expect(isAdrRecord("/repo/docs/adr/template.md")).toBe(false);
    expect(isAdrRecord("/repo/docs/adr/README.md")).toBe(false);
  });

  it("lints source files outside vendored or generated folders", () => {
    expect(isLintable("/repo/packages/ui/src/button.tsx")).toBe(true);
    expect(isLintable("/repo/tooling/src/adr.ts")).toBe(true);
    expect(isLintable("/repo/.claude/skills/gsap-core/script.js")).toBe(false);
    expect(isLintable("/repo/node_modules/x/index.js")).toBe(false);
    expect(isLintable("/repo/README.md")).toBe(false);
  });

  it("formats source, styles, data and docs", () => {
    expect(isFormattable("/repo/packages/ui/src/styles/theme.css")).toBe(true);
    expect(isFormattable("/repo/AGENTS.md")).toBe(true);
    expect(isFormattable("/repo/public/logo.png")).toBe(false);
    expect(isFormattable("/repo/.claude/skills/impeccable/SKILL.md")).toBe(false);
  });
});
