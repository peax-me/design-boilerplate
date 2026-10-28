import { ButtonLink } from "@repo/ui/components/button-link";
import { GitFork } from "lucide-react";

import { links } from "./links";

export function ForkButton() {
  return (
    <ButtonLink href={links.fork} size="lg">
      <GitFork />
      Fork the repository
    </ButtonLink>
  );
}
