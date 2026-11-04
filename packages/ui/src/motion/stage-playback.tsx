"use client";

import { Pause, Play } from "lucide-react";
import { createContext, type ReactNode, useState } from "react";

import { Button } from "../components/button.tsx";
import { Icon } from "../components/icon.tsx";

const PLAYING = { paused: false };
const PAUSED = { paused: true };

/* Whether the visitor paused the stage: its canvas draws no new frame until played again. */
export const StagePlaybackContext = createContext(PLAYING);

interface StagePlaybackProps {
  /* The scene layer: its canvas reads the playback. */
  children: ReactNode;
  /* The scene moves on its own and is live. */
  controllable: boolean;
  pauseLabel: string;
  playLabel: string;
}

/* WCAG 2.2.2: a scene that moves on its own can be paused. The control is named after the action it performs, so it carries no pressed state. */
export function StagePlayback({
  children,
  controllable,
  pauseLabel,
  playLabel,
}: StagePlaybackProps) {
  const [paused, setPaused] = useState(false);

  return (
    <StagePlaybackContext value={paused ? PAUSED : PLAYING}>
      {children}
      {controllable ? (
        <Button
          variant="secondary"
          size="icon"
          aria-label={paused ? playLabel : pauseLabel}
          className="absolute inset-e-3 bottom-3"
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
