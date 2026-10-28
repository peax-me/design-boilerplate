export interface EditedFile {
  filePath: string;
  writtenTexts: string[];
}

const ADR_RECORD = /\/docs\/adr\/\d{4}-[^/]+\.md$/u;
const LINTABLE = /\.(?:ts|tsx|js|mjs|cjs)$/u;
const FORMATTABLE = /\.(?:ts|tsx|js|mjs|cjs|json|jsonc|css|md|yaml|yml)$/u;
const EXCLUDED = /\/(?:node_modules|\.claude\/skills)\//u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function replacements(edits: unknown): string[] {
  if (!Array.isArray(edits)) {
    return [];
  }
  return edits.flatMap((edit: unknown) =>
    isRecord(edit) && typeof edit["new_string"] === "string" ? [edit["new_string"]] : [],
  );
}

export function readEditedFile(payload: unknown): EditedFile | undefined {
  if (!isRecord(payload) || !isRecord(payload["tool_input"])) {
    return undefined;
  }
  const input = payload["tool_input"];
  const filePath = input["file_path"];
  if (typeof filePath !== "string") {
    return undefined;
  }
  const texts = [input["content"], input["new_string"]].filter(
    (text): text is string => typeof text === "string",
  );
  return { filePath, writtenTexts: [...texts, ...replacements(input["edits"])] };
}

export function isAdrRecord(filePath: string): boolean {
  return ADR_RECORD.test(filePath);
}

export function isLintable(filePath: string): boolean {
  return LINTABLE.test(filePath) && !EXCLUDED.test(filePath);
}

export function isFormattable(filePath: string): boolean {
  return FORMATTABLE.test(filePath) && !EXCLUDED.test(filePath);
}
