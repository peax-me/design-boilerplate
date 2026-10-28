"use client";

import { Canvas, extend, type ThreeElement, useLoader, useThree } from "@react-three/fiber";
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
import { IsometricCamera } from "./isometric-camera.tsx";
import { type Tokens, useTokens } from "./scene-tokens.ts";

extend({ RoundedBoxGeometry });

declare module "@react-three/fiber" {
  interface ThreeElements {
    roundedBoxGeometry: ThreeElement<typeof RoundedBoxGeometry>;
  }
}

const CORNER_SEGMENTS = 4;
const HOP = 0.6;
const TILT = 0.06;

function hop(meshes: Mesh[], invalidate: () => void): void {
  gsap.to(
    meshes.map((mesh) => mesh.position),
    {
      y: `+=${HOP}`,
      duration: duration.fast,
      ease: ease.standard,
      yoyo: true,
      repeat: 1,
      stagger: stagger.tight,
      onUpdate: invalidate,
    },
  );
}

function usePointerTilt(group: RefObject<Group | null>, invalidate: () => void): void {
  useEffect(() => {
    function tilt(event: PointerEvent): void {
      if (group.current === null) {
        return;
      }
      gsap.to(group.current.rotation, {
        y: (event.clientX / window.innerWidth - 0.5) * TILT,
        duration: duration.slow,
        ease: ease.emphasized,
        onUpdate: invalidate,
      });
    }
    window.addEventListener("pointermove", tilt);
    return () => {
      window.removeEventListener("pointermove", tilt);
    };
  }, [group, invalidate]);
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

interface SceneProps {
  blocks: Block[];
  grain: string | undefined;
  host: HTMLElement;
  onReady: () => void;
}

function Blocks({ blocks, grain, host, onReady }: SceneProps) {
  const group = useRef<Group>(null);
  const meshes = useRef<Mesh[]>([]);
  const invalidate = useThree((state) => state.invalidate);
  const [onChange] = useState(() => () => {
    hop(meshes.current, invalidate);
  });
  const tokens = useTokens(host, onChange);
  const centreAt = centre(blocks);
  usePointerTilt(group, invalidate);

  useEffect(() => {
    invalidate();
    const frame = requestAnimationFrame(onReady);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [invalidate, onReady]);

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
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.22} />
      </mesh>
    </group>
  );
}

interface BlockSceneProps extends Omit<SceneProps, "host"> {
  className?: string;
}

export function BlockScene({ blocks, grain, onReady, className }: BlockSceneProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setHost} className={className} aria-hidden>
      {host === null ? null : (
        <Canvas flat shadows dpr={[1, 2]} frameloop="demand">
          <IsometricCamera blocks={blocks} bleed={-host.offsetLeft} />
          <ambientLight intensity={2} />
          <directionalLight
            castShadow
            intensity={1.6}
            position={[6, 30, 16]}
            shadow-mapSize={[1024, 1024]}
          >
            <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 100]} />
          </directionalLight>
          <Blocks blocks={blocks} grain={grain} host={host} onReady={onReady} />
        </Canvas>
      )}
    </div>
  );
}
