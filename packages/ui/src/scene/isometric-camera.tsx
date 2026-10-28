import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrthographicCamera } from "three";

import { type Block, DRAWING_MARGIN, drawingBounds } from "../lib/isometric.ts";
import { centre } from "./centre.ts";

const ZOOM_PER_UNIT = Math.sqrt(1.5);
const CAMERA_DISTANCE = 50;
const CAMERA_PITCH = -Math.atan(1 / Math.SQRT2);
const CAMERA_YAW = Math.PI / 4;

interface CameraProps {
  blocks: Block[];
  bleed: number;
}

export function IsometricCamera({ blocks, bleed }: CameraProps) {
  const camera = useRef<OrthographicCamera>(null);
  const { width, height } = useThree((state) => state.size);
  const setDefault = useThree((state) => state.set);
  const [x, z] = centre(blocks);
  useEffect(() => {
    const view = camera.current;
    if (view === null) {
      return;
    }
    view.left = -width / 2;
    view.right = width / 2;
    view.top = height / 2;
    view.bottom = -height / 2;
    view.zoom = ((width - bleed * 2) / drawingBounds(blocks, DRAWING_MARGIN).width) * ZOOM_PER_UNIT;
    view.updateProjectionMatrix();
    setDefault({ camera: view });
  }, [blocks, bleed, setDefault, width, height]);
  return (
    <orthographicCamera
      ref={camera}
      position={[x + CAMERA_DISTANCE, CAMERA_DISTANCE, z + CAMERA_DISTANCE]}
      rotation={[CAMERA_PITCH, CAMERA_YAW, 0, "YXZ"]}
      near={0.1}
      far={200}
    />
  );
}
