const STATUSES = new Set(["proposed", "accepted", "rejected", "deprecated", "superseded"]);
const FILE_NAME = /^(?<number>\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;
const FRONT_MATTER_STATUS = /^---\n(?:.*\n)*?status:\s*(?<status>\S+)\s*\n(?:.*\n)*?---/u;
const HUMAN_ONLY_STATUS = /^status:\s*(?:accepted|rejected)\b/mu;

export interface AdrFile {
  name: string;
  content: string;
}

export interface AdrProblem {
  file: string;
  problem: string;
}

function statusProblem({ name, content }: AdrFile): AdrProblem[] {
  const status = FRONT_MATTER_STATUS.exec(content)?.groups?.["status"];
  if (status === undefined) {
    return [{ file: name, problem: "missing status in front matter" }];
  }
  if (!STATUSES.has(status)) {
    return [{ file: name, problem: `unknown status "${status}"` }];
  }
  if (status === "proposed") {
    return [{ file: name, problem: "awaiting human approval (status: proposed)" }];
  }
  return [];
}

function numberingProblem(name: string, position: number): AdrProblem[] {
  const number = FILE_NAME.exec(name)?.groups?.["number"];
  if (number === undefined) {
    return [{ file: name, problem: "file name must match NNNN-kebab-title.md" }];
  }
  const expected = String(position + 1).padStart(4, "0");
  return number === expected ? [] : [{ file: name, problem: `expected number ${expected}` }];
}

export function findAdrProblems(files: AdrFile[]): AdrProblem[] {
  const sorted = files.toSorted((first, second) => first.name.localeCompare(second.name));
  return sorted.flatMap((file, position) =>
    numberingProblem(file.name, position).concat(statusProblem(file)),
  );
}

export function setsHumanOnlyStatus(text: string): boolean {
  return HUMAN_ONLY_STATUS.test(text);
}
