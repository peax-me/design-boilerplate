import { readFileSync } from "node:fs";

import { setsHumanOnlyStatus } from "../adr.ts";
import { isAdrRecord, readEditedFile } from "../hook-input.ts";

const BLOCKING_EXIT_CODE = 2;
const payload: unknown = JSON.parse(readFileSync(0, "utf8"));
const edited = readEditedFile(payload);

if (
  edited !== undefined &&
  isAdrRecord(edited.filePath) &&
  edited.writtenTexts.some(setsHumanOnlyStatus)
) {
  console.error(
    "Only a human can accept or reject an ADR. Keep `status: proposed` and ask the project owner to decide.",
  );
  process.exitCode = BLOCKING_EXIT_CODE;
}
