import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

/* The stage fades its scene in once something is drawn: onReady runs during the first frame, once. */
export function useFirstFrame(onReady: () => void): void {
  const drawn = useRef(false);

  useFrame(() => {
    if (drawn.current) {
      return;
    }
    drawn.current = true;
    onReady();
  });
}
