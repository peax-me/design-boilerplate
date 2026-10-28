import { ACROSS, type Block, DOWN, DRAWING_MARGIN, drawingBounds } from "../lib/isometric.ts";

export function centre(blocks: Block[]): [number, number] {
  const bounds = drawingBounds(blocks, DRAWING_MARGIN);
  const across = (bounds.x + bounds.width / 2) / ACROSS;
  const down = (bounds.y + bounds.height / 2) / DOWN;
  return [(across + down) / 2, (down - across) / 2];
}
