"use client";

import { cva } from "class-variance-authority";
import {
  type ReactElement,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

import { cn } from "../lib/cn.ts";
import { whenIdle } from "../lib/idle.ts";
import { type QualityTier, readDeviceProfile, tierFor } from "../lib/quality-tier.ts";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/* A scene loads once it comes within half a window height of the viewport. */
const NEAR_WINDOW = "50% 0px";
/* On light devices the scene waits for one of these, so a page load alone never pays for it. */
const FIRST_INTERACTIONS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/* An effect that may have nothing to set up returns no cleanup. */
type EffectCleanup = (() => void) | undefined;

const fadeVariants = cva("transition-opacity duration-500", {
  variants: {
    shown: { true: "opacity-100", false: "opacity-0" },
  },
});

function useIdleTier(): QualityTier | null {
  const [tier, setTier] = useState<QualityTier | null>(null);

  useEffect(
    () =>
      whenIdle(() => {
        setTier(tierFor(readDeviceProfile()));
      }),
    [],
  );

  return tier;
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

function useFirstInteraction(watching: boolean): boolean {
  const [interacted, setInteracted] = useState(false);

  useEffect((): EffectCleanup => {
    if (!watching) {
      return undefined;
    }
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
  }, [watching]);

  return interacted;
}

/* Once the context is lost or motion is reduced, the poster stays for the life of the page. */
function usePosterFallback(root: HTMLElement | null): boolean {
  const [fellBack, setFellBack] = useState(false);

  useEffect((): EffectCleanup => {
    if (root === null) {
      return undefined;
    }
    const listening = new AbortController();
    function fallBack(): void {
      setFellBack(true);
    }
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
  }, [root]);

  return fellBack;
}

/* The tier to run the scene at once every trigger has fired: the page is idle, the device can run a scene, the stage nears the window and, on light devices, the visitor has interacted. */
function useSceneTier(root: HTMLElement | null): QualityTier | null {
  const tier = useIdleTier();
  const near = useNearWindow(root, tier !== null);
  const interacted = useFirstInteraction(tier === "light");
  const fellBack = usePosterFallback(root);

  if (tier === null || !near || fellBack) {
    return null;
  }
  if (tier === "light" && !interacted) {
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
  /* The scene moves on its own: the motion audit expects its frames to change. */
  ambient?: boolean;
  className?: string;
}

export function Stage({
  poster,
  renderScene,
  ambient = false,
  className,
}: StageProps): ReactElement {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => {
    setReady(true);
  }, []);
  const tier = useSceneTier(root);
  const live = tier !== null && ready;

  return (
    <div
      ref={setRoot}
      data-slot="stage"
      data-stage={live ? "live" : "poster"}
      data-ambient={ambient ? "" : undefined}
      className={cn("relative", className)}
    >
      <div className={fadeVariants({ shown: !live })}>{poster}</div>
      {tier === null ? null : (
        <div aria-hidden className={cn("absolute inset-0", fadeVariants({ shown: live }))}>
          <Suspense fallback={null}>{renderScene({ tier, onReady })}</Suspense>
        </div>
      )}
    </div>
  );
}
