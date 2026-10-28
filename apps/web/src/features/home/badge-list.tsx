import { Badge } from "@repo/ui/components/badge";
import { Inline } from "@repo/ui/layout/inline";
import type { ComponentProps } from "react";

interface BadgeListProps {
  items: string[];
  label: string;
  variant?: ComponentProps<typeof Badge>["variant"];
}

export function BadgeList({ items, label, variant }: BadgeListProps) {
  return (
    <Inline as="ul" gap="xs" aria-label={label}>
      {items.map((item) => (
        <li key={item}>
          <Badge variant={variant}>{item}</Badge>
        </li>
      ))}
    </Inline>
  );
}
