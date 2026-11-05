"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { enterUnseen } from "./enter-unseen.ts";
import { duration, ease, stagger } from "./tokens.ts";

gsap.registerPlugin(useGSAP);

const ALLOW_MOTION = "(prefers-reduced-motion: no-preference)";
const DROP = -3;

interface DropInProps {
  scope: RefObject<HTMLElement | null>;
}

/* Drops the scene items of its scope into place, one after the other, when motion is allowed and the visitor has not seen them yet. */
export function DropIn({ scope }: DropInProps): null {
  useGSAP(
    () => {
      gsap.matchMedia().add(ALLOW_MOTION, () =>
        enterUnseen(scope.current, () =>
          gsap.from("[data-scene-item]", {
            y: DROP,
            opacity: 0,
            duration: duration.slow,
            ease: ease.emphasized,
            stagger: stagger.tight,
          }),
        ),
      );
    },
    { scope },
  );

  return null;
}
