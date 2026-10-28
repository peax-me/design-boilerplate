import { project } from "@repo/ui/lib/isometric";
import { duration, ease, stagger } from "@repo/ui/motion/tokens";

import { renegadeBlocks, renegadePairs } from "./blocks";
import { renegadeSteps } from "./renegade-steps";

const DIMMED = 0.3;
const DROP = -1.5;
const GLIDE = 1;
const FADE_FROM = 0.6;

const blockById = new Map(renegadeBlocks.map((block) => [block.id, block]));

function item(id: string): string {
  return `[data-scene-item='${id}']`;
}

function labelOf(id: string): string {
  return item(`${id}-label`);
}

function all(ids: readonly string[], select: (id: string) => string): string {
  return ids.map((id) => select(id)).join(", ");
}

const draftIds = renegadePairs.map((pair) => pair.draft);
const flagIds = renegadePairs.map((pair) => pair.flag);
const tokenIds = renegadePairs.map((pair) => pair.token);
const stepIds = renegadeSteps.map((_, index) => `step-${index}`);

function focusStep(timeline: gsap.core.Timeline, index: number, label: string): void {
  stepIds.forEach((id, other) => {
    timeline.to(
      item(id),
      { opacity: other === index ? 1 : DIMMED, duration: duration.base },
      label,
    );
  });
}

function glide(
  timeline: gsap.core.Timeline,
  pair: (typeof renegadePairs)[number],
  at: number,
): void {
  const draft = blockById.get(pair.draft);
  const token = blockById.get(pair.token);
  if (draft === undefined || token === undefined) {
    return;
  }
  const [x, y] = project(token.x - draft.x, token.y - draft.y, token.z - draft.z);
  const pieces = `${item(pair.draft)}, ${item(pair.flag)}, ${labelOf(pair.flag)}`;
  const fadeAt = at + GLIDE * FADE_FROM;
  const fade = GLIDE * (1 - FADE_FROM);
  timeline
    .to(pieces, { x, y, duration: GLIDE, ease: ease.inOut }, at)
    .to(pieces, { opacity: 0, duration: fade, ease: ease.inOut }, fadeAt)
    .to(
      `${item(pair.token)}, ${labelOf(pair.token)}`,
      { opacity: 1, duration: fade, ease: ease.inOut },
      fadeAt,
    );
}

export function snapRenegades(timeline: gsap.core.Timeline): void {
  timeline
    .set(all(stepIds, item), { opacity: DIMMED }, 0)
    .set(`${all(tokenIds, item)}, ${all(tokenIds, labelOf)}`, { opacity: 0 }, 0)
    .addLabel("draft");
  focusStep(timeline, 0, "draft");
  timeline.fromTo(
    all(draftIds, item),
    { opacity: 0, y: DROP },
    { opacity: 1, y: 0, duration: duration.slow, ease: ease.inOut, stagger: stagger.loose },
    "draft",
  );
  timeline.addLabel("detect", `>+${duration.base}`);
  focusStep(timeline, 1, "detect");
  timeline.fromTo(
    `${all(flagIds, item)}, ${all(flagIds, labelOf)}`,
    { opacity: 0 },
    { opacity: 1, duration: duration.slow, ease: ease.inOut, stagger: stagger.loose },
    "detect",
  );
  timeline.addLabel("snap", `>+${duration.base}`);
  focusStep(timeline, 2, `snap+=${duration.base}`);
  const snapStart = timeline.labels["snap"] ?? 0;
  renegadePairs.forEach((pair, index) => {
    glide(timeline, pair, snapStart + index * stagger.loose);
  });
  timeline.to(all(stepIds, item), { opacity: 1, duration: duration.slow }, `>+${duration.base}`);
}
