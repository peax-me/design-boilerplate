import { useFrame } from "@react-three/fiber";

/* A box that reports the delta of every frame it is drawn in. */
export function FrameCounter({ onFrame }: { onFrame: (delta: number) => void }) {
  useFrame((_state, delta) => {
    onFrame(delta);
  });
  return (
    <mesh>
      <boxGeometry />
      <meshBasicMaterial />
    </mesh>
  );
}
