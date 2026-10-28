import { cva, type VariantProps } from "class-variance-authority";
import { type SVGAttributes, useId } from "react";

import { cn } from "../lib/cn.ts";
import {
  type Block,
  type Material,
  type Point,
  DRAWING_MARGIN,
  blockFaces,
  drawingBounds,
  paintOrder,
  project,
} from "../lib/isometric.ts";
import { type FaceName, GrainPatterns } from "./grain-patterns.tsx";

function materialColor(material: Material): string {
  return `var(--${material})`;
}

const LEFT_LIGHT = 85;
const RIGHT_LIGHT = 70;
/* Corners round with the corner preset; a block module spreads with the module preset. */
const CORNER_STROKE = "calc(var(--corner-scale) * 0.12)";

function shade(material: Material, light: number): string {
  return `color-mix(in oklch, ${materialColor(material)} ${light}%, var(--primary-foreground))`;
}

function spread(block: Block): string {
  const [x, y] = project(block.x, block.y, 0);
  return `translate(calc((var(--module-scale) - 1) * ${x}px), calc((var(--module-scale) - 1) * ${y}px))`;
}

const isoBlocksVariants = cva("block h-auto overflow-visible", {
  variants: {
    size: {
      icon: "w-10",
      sm: "w-32",
      md: "w-48",
      fill: "w-full",
      frame: "h-32 w-full",
    },
  },
  defaultVariants: { size: "fill" },
});

const LABEL_SIZE = 0.42;
const LABEL_LIFT = 0.35;
const LABEL_HALO = 0.14;

function polygon(face: Point[]): string {
  return face.map((point) => point.join(",")).join(" ");
}

interface FaceProps {
  face: Point[];
  color: string;
  grain: string | undefined;
}

function Face({ face, color, grain }: FaceProps) {
  return (
    <>
      <polygon points={polygon(face)} style={{ fill: color, stroke: color }} />
      {grain === undefined ? null : (
        <polygon points={polygon(face)} style={{ fill: grain, mixBlendMode: "multiply" }} />
      )}
    </>
  );
}

function BlockLabel({ block }: { block: Block }) {
  const [x, y] = project(
    block.x + block.width / 2,
    block.y + block.depth / 2,
    block.z + block.height,
  );
  return (
    <g
      data-scene-item={`${block.id}-label`}
      className={block.draft === true ? "opacity-0" : undefined}
      style={{ transform: spread(block) }}
    >
      <text
        x={x}
        y={y - LABEL_LIFT}
        fontSize={LABEL_SIZE}
        textAnchor="middle"
        strokeWidth={LABEL_HALO}
        paintOrder="stroke"
        style={{ fill: "var(--primary-foreground)", stroke: "var(--paper)" }}
        className="font-mono"
      >
        {block.label}
      </text>
    </g>
  );
}

interface IsoBlocksProps
  extends Omit<SVGAttributes<SVGSVGElement>, "children">, VariantProps<typeof isoBlocksVariants> {
  blocks: Block[];
  label: string;
  grain?: string | undefined;
}

export function IsoBlocks({ blocks, label, grain, size, className, ...props }: IsoBlocksProps) {
  const bounds = drawingBounds(blocks, DRAWING_MARGIN);
  const patternId = `grain${useId().replaceAll(/[^\w-]/gu, "")}`;
  function grainOf(face: FaceName): string | undefined {
    return grain === undefined ? undefined : `url(#${patternId}-${face})`;
  }
  return (
    <svg
      data-slot="iso-blocks"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an inline SVG drawn from data cannot be an <img>; role="img" gives it one accessible name
      role="img"
      aria-label={label}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      preserveAspectRatio={size === "frame" ? "xMinYMax meet" : undefined}
      className={cn(isoBlocksVariants({ size }), className)}
      {...props}
    >
      {grain === undefined ? null : <GrainPatterns id={patternId} grain={grain} />}
      {paintOrder(blocks).map((block) => {
        const faces = blockFaces(block);
        return (
          <g key={block.id} style={{ transform: spread(block) }}>
            <g
              data-scene-item={block.id}
              className={block.draft === true ? "opacity-0" : undefined}
              strokeLinejoin="round"
              style={{ strokeWidth: CORNER_STROKE }}
            >
              <Face face={faces.top} color={materialColor(block.material)} grain={grainOf("top")} />
              <Face
                face={faces.left}
                color={shade(block.material, LEFT_LIGHT)}
                grain={grainOf("left")}
              />
              <Face
                face={faces.right}
                color={shade(block.material, RIGHT_LIGHT)}
                grain={grainOf("right")}
              />
            </g>
          </g>
        );
      })}
      {blocks
        .filter((block) => block.label !== undefined)
        .map((block) => (
          <BlockLabel key={block.id} block={block} />
        ))}
    </svg>
  );
}
