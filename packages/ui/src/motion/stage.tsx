"use client";

import { cva } from "class-variance-authority";
import {
  type ReactElement,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";

import { cn } from "../lib/cn.ts";
import {
  implementsWebgl2,
  type QualityTier,
  readDeviceProfile,
  supportsWebgl2,
  tierFor,
} from "../lib/quality-tier.ts";
import { SilentBoundary } from "../lib/silent-boundary.tsx";
import { useIdle } from "../lib/use-idle.ts";
import { loadStageRuntime } from "../scene/stage-runtime.ts";
import { StagePlayback } from "./stage-playback.tsx";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/* A scene loads once it comes within half a window height of the viewport. */
const NEAR_WINDOW = "50% 0px";
/* On light devices the scene waits for one of these, so a page load alone never pays for it. */
const FIRST_INTERACTIONS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/* An effect that may have nothing to set up returns no cleanup. */
type EffectCleanup = (() => void) | undefined;

type PrepareScene = () => Promise<unknown>;

const fadeVariants = cva("transition-opacity duration-500", {
  variants: {
    shown: { true: "opacity-100", false: "opacity-0" },
  },
});

/* Read once, when the page first goes idle. */
function useIdleTier(): QualityTier | null {
  const idle = useIdle();
  return useMemo(() => (idle ? tierFor(readDeviceProfile()) : null), [idle]);
}

function useNearWindow(root: HTMLElement | null, watching: boolean): boolean {
  const [near, setNear] = useState(false);

  useEffect((): EffectCleanup => {
    if (root === null || !watching) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      /* The document's own viewport: the implicit root clips a stage inside a frame (Storybook) before the margin applies. */
      { root: document, rootMargin: NEAR_WINDOW },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
    };
  }, [root, watching]);

  return near;
}

/* Listened from mount: a visitor who scrolls while the page loads, then stops, has already interacted. */
function useFirstInteraction(): boolean {
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    const listening = new AbortController();
    function interact(): void {
      setInteracted(true);
      listening.abort();
    }
    for (const type of FIRST_INTERACTIONS) {
      window.addEventListener(type, interact, { passive: true, signal: listening.signal });
    }
    return () => {
      listening.abort();
    };
  }, []);

  return interacted;
}

/* Once the scene fails, its context is lost or motion is reduced, the poster stays for the life of the page. */
function usePosterFallback(root: HTMLElement | null): [fellBack: boolean, fallBack: () => void] {
  const [fellBack, setFellBack] = useState(false);
  const fallBack = useCallback(() => {
    setFellBack(true);
  }, []);

  useEffect((): EffectCleanup => {
    if (root === null) {
      return undefined;
    }
    const listening = new AbortController();
    /* A lost context does not bubble: only the capture phase reaches the root. */
    root.addEventListener("webglcontextlost", fallBack, {
      capture: true,
      signal: listening.signal,
    });
    window.matchMedia(REDUCED_MOTION).addEventListener(
      "change",
      (event) => {
        if (event.matches) {
          fallBack();
        }
      },
      { signal: listening.signal },
    );
    return () => {
      listening.abort();
    };
  }, [root, fallBack]);

  return [fellBack, fallBack];
}

/* Once the scene may load on a device that could run it, three.js, the React renderer and then the scene's own module load, each evaluated in a task of its own: mounting the scene later evaluates no code. A failed preparation still lets the scene mount, and its own load reports the failure. */
function usePreparedScene(tier: QualityTier | null, prepareScene?: PrepareScene): boolean {
  const [prepared, setPrepared] = useState(false);
  const prepare = useEffectEvent(() => prepareScene?.());

  useEffect((): EffectCleanup => {
    if (tier === null || !implementsWebgl2()) {
      return undefined;
    }
    let mounted = true;
    function settle(): void {
      if (mounted) {
        setPrepared(true);
      }
    }
    loadStageRuntime()
      .then(() => prepare())
      .then(settle, settle);
    return () => {
      mounted = false;
    };
  }, [tier]);

  return prepared;
}

/* The tier the scene may load at once the page is idle and motion is allowed: on light devices, only once the visitor has interacted, so a page load alone loads nothing. */
function useLoadingTier(): QualityTier | null {
  const tier = useIdleTier();
  const interacted = useFirstInteraction();

  if (tier === "light" && !interacted) {
    return null;
  }
  return tier;
}

/* The tier to run the scene at once it may load, is prepared, nears the window and the device can create a WebGL2 context. Creating a context is the costliest probe: it is made only for a scene about to mount, so a page that never loads one never pays for it. Each stage asks once: without WebGL2 its poster stays for the life of the page. */
function useSceneTier(root: HTMLElement | null, prepareScene?: PrepareScene): QualityTier | null {
  const tier = useLoadingTier();
  const prepared = usePreparedScene(tier, prepareScene);
  const near = useNearWindow(root, tier !== null);
  const mayMount = tier !== null && prepared && near;
  const webgl2 = useMemo(() => mayMount && supportsWebgl2(), [mayMount]);

  if (tier === null || !webgl2) {
    return null;
  }
  return tier;
}

export interface SceneProps {
  tier: QualityTier;
  onReady: () => void;
}

interface StageProps {
  /* The complete still image, shown first and whenever the scene cannot run: it carries the accessible name. */
  poster: ReactNode;
  /* Renders a lazy component holding a StageCanvas; it calls onReady once its first frame is drawn. */
  renderScene: (props: SceneProps) => ReactNode;
  /* Makes the import the lazy component makes, ahead of time: the stage calls it once the scene may load, before it nears the window, and mounts the scene once it settles. */
  prepareScene?: PrepareScene;
  /* The scene moves on its own: the motion audit expects its frames to change, and once live it gets a control to pause it (WCAG 2.2.2). */
  ambient?: boolean;
  /* Names of that control, after the action it performs. */
  pauseLabel?: string;
  playLabel?: string;
  /* Sizing the stage sizes its poster layer too, so a poster can cover it; an unsized stage takes the size of its poster. */
  className?: string;
}

export function Stage({
  poster,
  renderScene,
  prepareScene,
  ambient = false,
  pauseLabel = "Pause animation",
  playLabel = "Play animation",
  className,
}: StageProps): ReactElement {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => {
    setReady(true);
  }, []);
  const triggeredTier = useSceneTier(root, prepareScene);
  const [fellBack, fallBack] = usePosterFallback(root);
  const tier = fellBack ? null : triggeredTier;
  const live = tier !== null && ready;

  return (
    <div
      ref={setRoot}
      data-slot="stage"
      data-stage={live ? "live" : "poster"}
      data-ambient={ambient ? "" : undefined}
      className={cn("relative", className)}
    >
      <div className={cn("size-full", fadeVariants({ shown: !live }))}>{poster}</div>
      {tier === null ? null : (
        <StagePlayback controllable={ambient && live} pauseLabel={pauseLabel} playLabel={playLabel}>
          <div aria-hidden className={cn("absolute inset-0", fadeVariants({ shown: live }))}>
            <SilentBoundary onError={fallBack}>
              <Suspense fallback={null}>{renderScene({ tier, onReady })}</Suspense>
            </SilentBoundary>
          </div>
        </StagePlayback>
      )}
    </div>
  );
}
