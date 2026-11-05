import { createContext } from "react";

interface StagePlaybackValue {
  paused: boolean;
}

const PLAYING: StagePlaybackValue = { paused: false };
const PAUSED: StagePlaybackValue = { paused: true };

/* One stable value per state, so a provider never hands its readers a new object. */
export function playbackFor(paused: boolean): StagePlaybackValue {
  return paused ? PAUSED : PLAYING;
}

/* Whether the visitor paused the stage: its canvas draws no new frame until played again. */
export const StagePlaybackContext = createContext(PLAYING);
