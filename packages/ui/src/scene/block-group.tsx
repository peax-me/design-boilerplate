"use client";

import { extend, type ThreeElement, useLoader, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { type RefObject, useEffect, useRef, useState } from "react";
import {
  type Color,
  type Group,
  type Mesh,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

import { type Block, type Material, cornerRadius } from "../lib/isometric.ts";
import { duration, ease, stagger } from "../motion/tokens.ts";
import { centre } from "./centre.ts";
import { type Tokens, useTokens } from "./scene-tokens.ts";
import { useFirstFrame } from "./use-first-frame.ts";

extend({ RoundedBoxGeometry });

declare module "@react-three/fiber" {
  interface ThreeElements {
    roundedBoxGeometry: ThreeElement<typeof RoundedBoxGeometry>;
  }
}

const CORNER_SEGMENTS = 4;
const HOP = 0.6;
const TILT = 0.06;

function hop(meshes: Mesh[]): void {
  gsap.to(
    meshes.map((mesh) => mesh.position),
    {
      y: `+=${HOP}`,
      duration: duration.fast,
      ease: ease.standard,
      yoyo: true,
      repeat: 1,
      stagger: stagger.tight,
    },
  );
}

/* The group leans toward the mouse through one reused tween. A finger means scroll on a phone, so touch never tilts it. */
function usePointerTilt(group: RefObject<Group | null>): void {
  useEffect((): (() => void) | undefined => {
    if (group.current === null) {
      return undefined;
    }
    const tiltTo = gsap.quickTo(group.current.rotation, "y", {
      duration: duration.slow,
      ease: ease.emphasized,
    });
    function tilt(event: PointerEvent): void {
      if (event.pointerType === "mouse") {
        tiltTo((event.clientX / window.innerWidth - 0.5) * TILT);
      }
    }
    window.addEventListener("pointermove", tilt, { passive: true });
    return () => {
      window.removeEventListener("pointermove", tilt);
      tiltTo.tween.kill();
    };
  }, [group]);
}

/* Each face shows a slice of the texture, so the grain keeps a real-wood scale on small blocks. */
const GRAIN_REPEAT = 0.3;
const GRAIN_RELIEF = 0.02;
/* Lacquer is glossier than raw maple; the grain shows through every finish. */
const ROUGHNESS: Record<Material, number> = {
  maple: 0.75,
  lacquer: 0.35,
  paper: 0.6,
  ink: 0.5,
  signal: 0.4,
};

function Grain({ url, color, roughness }: { url: string; color: Color; roughness: number }) {
  const texture = useLoader(TextureLoader, url);
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  return (
    <meshStandardMaterial color={color} roughness={roughness} bumpScale={GRAIN_RELIEF}>
      <primitive
        object={texture}
        attach="map"
        colorSpace={SRGBColorSpace}
        wrapS={RepeatWrapping}
        wrapT={RepeatWrapping}
        repeat={[GRAIN_REPEAT, GRAIN_REPEAT]}
        anisotropy={anisotropy}
      />
      <primitive object={texture} attach="bumpMap" />
    </meshStandardMaterial>
  );
}

interface BlockMeshProps {
  block: Block;
  tokens: Tokens;
  grain: string | undefined;
  centreAt: [number, number];
  onMesh: (mesh: Mesh | null) => void;
}

function BlockMesh({ block, tokens, grain, centreAt, onMesh }: BlockMeshProps) {
  const [x, z] = centreAt;
  const spread = tokens.moduleScale;
  return (
    <mesh
      ref={onMesh}
      castShadow={block.z === 0}
      receiveShadow
      position={[
        block.x * spread + block.width / 2 - x,
        block.z + block.height / 2,
        block.y * spread + block.depth / 2 - z,
      ]}
    >
      <roundedBoxGeometry
        args={[
          block.width,
          block.height,
          block.depth,
          CORNER_SEGMENTS,
          cornerRadius(block, tokens.cornerScale),
        ]}
      />
      {grain === undefined ? (
        <meshStandardMaterial
          color={tokens.palette[block.material]}
          roughness={ROUGHNESS[block.material]}
        />
      ) : (
        <Grain
          url={grain}
          color={tokens.palette[block.material]}
          roughness={ROUGHNESS[block.material]}
        />
      )}
    </mesh>
  );
}

interface BlockGroupProps {
  blocks: Block[];
  grain: string | undefined;
  host: HTMLElement;
  /* Whether the canvas renders shadows: only then is there a ground to catch them. */
  shadows: boolean;
  onReady: () => void;
}

export function BlockGroup({ blocks, grain, host, shadows, onReady }: BlockGroupProps) {
  const group = useRef<Group>(null);
  const meshes = useRef<Mesh[]>([]);
  const [onChange] = useState(() => () => {
    hop(meshes.current);
  });
  const tokens = useTokens(host, onChange);
  const centreAt = centre(blocks);
  usePointerTilt(group);
  useFirstFrame(onReady);

  return (
    <group ref={group} position={[centreAt[0], 0, centreAt[1]]}>
      {blocks.map((block, index) => (
        <BlockMesh
          key={block.id}
          block={block}
          tokens={tokens}
          grain={grain}
          centreAt={centreAt}
          onMesh={(mesh) => {
            if (mesh !== null) {
              meshes.current[index] = mesh;
            }
          }}
        />
      ))}
      {shadows ? (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <shadowMaterial opacity={0.22} />
        </mesh>
      ) : null}
    </group>
  );
}
