export interface CanvasFrame {
  canvas: string;
  progress: number;
  luminance: number[];
}

export interface AmbientPair {
  canvas: string;
  first: number[];
  second: number[];
}

export interface MotionViolation {
  rule: "blank-canvas" | "frozen-canvas" | "render-error";
  canvas: string;
  detail: string;
}

const BLANK_DEVIATION = 2;
const FROZEN_DIFFERENCE = 0.5;
export const AMBIENT_INTERVAL_MS = 500;
/* three logs a lost context at the log level and throws when it cannot create one: the audit reads every console level, and only these patterns fail it. */
const RENDER_ERROR =
  /THREE\.WebGLProgram|Shader Error|GL_INVALID|CONTEXT_LOST_WEBGL|WebGLRenderer: Context Lost|Error creating WebGL context/u;
const PAGE_CANVAS = "page";

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function luminanceDeviation(luminance: number[]): number {
  const mean = average(luminance);
  return Math.sqrt(average(luminance.map((value) => (value - mean) ** 2)));
}

export function meanDifference(first: number[], second: number[]): number {
  return average(first.map((value, index) => Math.abs(value - Number(second[index]))));
}

export function findBlankCanvases(frames: CanvasFrame[]): MotionViolation[] {
  return frames.flatMap(({ canvas, progress, luminance }) => {
    const deviation = luminanceDeviation(luminance);
    if (deviation >= BLANK_DEVIATION) {
      return [];
    }
    const detail = `deviation ${deviation.toFixed(2)} at ${Math.round(progress * 100)}%`;
    return [{ rule: "blank-canvas" as const, canvas, detail }];
  });
}

export function findFrozenCanvases(pairs: AmbientPair[]): MotionViolation[] {
  return pairs.flatMap(({ canvas, first, second }) => {
    const difference = meanDifference(first, second);
    if (difference >= FROZEN_DIFFERENCE) {
      return [];
    }
    const detail = `mean difference ${difference.toFixed(2)} over ${AMBIENT_INTERVAL_MS} ms`;
    return [{ rule: "frozen-canvas" as const, canvas, detail }];
  });
}

export function findRenderErrors(messages: string[]): MotionViolation[] {
  return messages
    .filter((message) => RENDER_ERROR.test(message))
    .map((detail) => ({ rule: "render-error", canvas: PAGE_CANVAS, detail }));
}
