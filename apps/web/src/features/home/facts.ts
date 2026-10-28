import { join } from "node:path";

import { readRepositoryFacts } from "@/lib/repository-facts";

export const facts = readRepositoryFacts(join(process.cwd(), "..", ".."));
