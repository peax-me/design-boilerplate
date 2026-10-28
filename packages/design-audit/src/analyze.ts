export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ElementSnapshot {
  id: number;
  parentId: number | null;
  label: string;
  layout: "flex" | "grid" | "flow";
  inFlow: boolean;
  interactive: boolean;
  padding: { top: string; right: string; bottom: string; left: string };
  gap: { row: string; column: string };
  fontSize: string;
  radius: string;
  box: Box;
}

export interface TokenScales {
  spacing: string[];
  fontSize: string[];
  radius: string[];
}

export interface DesignViolation {
  rule:
    | "off-scale-spacing"
    | "off-scale-font-size"
    | "off-scale-radius"
    | "asymmetric-padding"
    | "small-target"
    | "overlap";
  element: string;
  detail: string;
}

const MIN_TARGET_PX = 24;
const FULLY_ROUNDED_PX = 9999;
const OVERLAP_TOLERANCE_PX = 1;

type Rule = DesignViolation["rule"];
type ScaleCheck = (element: ElementSnapshot, values: string[]) => DesignViolation[];

function scaleCheck(rule: Rule, scale: ReadonlySet<string>): ScaleCheck {
  return (element, values) =>
    values
      .filter((value) => value !== "normal" && !scale.has(value))
      .map((detail) => ({ rule, element: element.label, detail }));
}

function pixels(value: string): number {
  return Number(value.replace(/px$/u, ""));
}

function spacingValues({ padding, gap }: ElementSnapshot): string[] {
  return [padding.top, padding.right, padding.bottom, padding.left, gap.row, gap.column];
}

function radiusValues({ radius }: ElementSnapshot): string[] {
  return pixels(radius) >= FULLY_ROUNDED_PX ? [] : [radius];
}

function symmetryViolations(element: ElementSnapshot): DesignViolation[] {
  const { top, right, bottom, left } = element.padding;
  if (top === bottom && left === right) {
    return [];
  }
  return [
    {
      rule: "asymmetric-padding",
      element: element.label,
      detail: `${top} ${right} ${bottom} ${left}`,
    },
  ];
}

function targetViolations(element: ElementSnapshot): DesignViolation[] {
  const { width, height } = element.box;
  if (!element.interactive || (width >= MIN_TARGET_PX && height >= MIN_TARGET_PX)) {
    return [];
  }
  return [{ rule: "small-target", element: element.label, detail: `${width}x${height}` }];
}

function overlaps(first: Box, second: Box): boolean {
  return (
    first.left < second.right - OVERLAP_TOLERANCE_PX &&
    second.left < first.right - OVERLAP_TOLERANCE_PX &&
    first.top < second.bottom - OVERLAP_TOLERANCE_PX &&
    second.top < first.bottom - OVERLAP_TOLERANCE_PX
  );
}

function consecutiveOverlaps(children: ElementSnapshot[]): DesignViolation[] {
  return children.flatMap((current, index) => {
    const next = children[index + 1];
    if (next === undefined || !overlaps(current.box, next.box)) {
      return [];
    }
    return [{ rule: "overlap" as const, element: current.label, detail: `overlaps ${next.label}` }];
  });
}

function overlapViolations(elements: ElementSnapshot[]): DesignViolation[] {
  const layoutParents = new Set(
    elements.filter((element) => element.layout !== "flow").map((element) => element.id),
  );
  const siblings = Map.groupBy(
    elements.filter((element) => element.inFlow && layoutParents.has(element.parentId ?? -1)),
    (element) => element.parentId,
  );
  return [...siblings.values()].flatMap((children) => consecutiveOverlaps(children));
}

export function findDesignViolations(
  scales: TokenScales,
  elements: ElementSnapshot[],
): DesignViolation[] {
  const spacing = scaleCheck("off-scale-spacing", new Set(scales.spacing));
  const fontSize = scaleCheck("off-scale-font-size", new Set(scales.fontSize));
  const radius = scaleCheck("off-scale-radius", new Set(scales.radius));
  const perElement = elements.flatMap((element) => [
    ...spacing(element, spacingValues(element)),
    ...fontSize(element, [element.fontSize]),
    ...radius(element, radiusValues(element)),
    ...symmetryViolations(element),
    ...targetViolations(element),
  ]);
  return [...perElement, ...overlapViolations(elements)];
}
