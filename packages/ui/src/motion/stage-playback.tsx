"use client";

import { Pause, Play } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "../components/button.tsx";
import { Icon } from "../components/icon.tsx";
import { playbackFor, StagePlaybackContext } from "./stage-playback-context.ts";

interface StagePlaybackProps {
  /* The scene layer: its canvas reads the playback. */
  children: ReactNode;
  /* The scene moves on its own and is live. */
  controllable: boolean;
  pauseLabel: string;
  playLabel: string;
}

/* WCAG 2.2.2: a scene that moves on its own can be paused. The control is named after the action it performs, so it carries no pressed state.
   It sits over the canvas, so its background stays opaque, hovered too: its icon contrasts with it whatever the scene draws behind (WCAG 1.4.11). */
export function StagePlayback({
  children,
  controllable,
  pauseLabel,
  playLabel,
}: StagePlaybackProps) {
  const [paused, setPaused] = useState(false);

  return (
    <StagePlaybackContext value={playbackFor(paused)}>
      {children}
      {controllable ? (
        <Button
          variant="secondary"
          size="icon"
          aria-label={paused ? playLabel : pauseLabel}
          className="absolute inset-e-3 bottom-3 hover:bg-muted"
          onClick={() => {
            setPaused((wasPaused) => !wasPaused);
          }}
        >
          <Icon icon={paused ? Play : Pause} size="sm" />
        </Button>
      ) : null}
    </StagePlaybackContext>
  );
}
