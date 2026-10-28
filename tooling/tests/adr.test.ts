import { describe, expect, it } from "vitest";

import { findAdrProblems, setsHumanOnlyStatus } from "../src/adr.ts";

function adr(status: string): string {
  return `---\nstatus: ${status}\ndate: 2026-10-28\n---\n\n# Title\n`;
}

describe("findAdrProblems", () => {
  it("accepts a sequence of decided records", () => {
    const files = [
      { name: "0001-first.md", content: adr("accepted") },
      { name: "0002-second.md", content: adr("superseded") },
      { name: "0003-third.md", content: adr("rejected") },
      { name: "0004-fourth.md", content: adr("deprecated") },
    ];
    expect(findAdrProblems(files)).toEqual([]);
  });

  it("flags records still awaiting a human decision", () => {
    expect(findAdrProblems([{ name: "0001-first.md", content: adr("proposed") }])).toEqual([
      { file: "0001-first.md", problem: "awaiting human approval (status: proposed)" },
    ]);
  });

  it("flags missing and unknown statuses", () => {
    const files = [
      { name: "0001-first.md", content: "# No front matter\n" },
      { name: "0002-second.md", content: adr("approved") },
    ];
    expect(findAdrProblems(files)).toEqual([
      { file: "0001-first.md", problem: "missing status in front matter" },
      { file: "0002-second.md", problem: 'unknown status "approved"' },
    ]);
  });

  it("flags file names that break the NNNN-kebab-title convention", () => {
    expect(findAdrProblems([{ name: "1-First_Decision.md", content: adr("accepted") }])).toEqual([
      { file: "1-First_Decision.md", problem: "file name must match NNNN-kebab-title.md" },
    ]);
  });

  it("flags gaps and duplicates in the numbering", () => {
    const files = [
      { name: "0001-first.md", content: adr("accepted") },
      { name: "0001-again.md", content: adr("accepted") },
      { name: "0003-third.md", content: adr("accepted") },
    ];
    expect(findAdrProblems(files)).toEqual([
      { file: "0001-first.md", problem: "expected number 0002" },
    ]);
  });
});

describe("setsHumanOnlyStatus", () => {
  it("detects an accepted or rejected status line", () => {
    expect(setsHumanOnlyStatus("---\nstatus: accepted\n---")).toBe(true);
    expect(setsHumanOnlyStatus("status:   rejected")).toBe(true);
  });

  it("allows agent-owned statuses and prose mentioning acceptance", () => {
    expect(setsHumanOnlyStatus("---\nstatus: proposed\n---")).toBe(false);
    expect(setsHumanOnlyStatus("Once the status is accepted, the ADR is immutable.")).toBe(false);
  });
});
