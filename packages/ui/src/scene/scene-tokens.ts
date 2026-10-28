import { useEffect, useState } from "react";
import { Color, SRGBColorSpace } from "three";

import { resolveMaterial } from "../lib/css-color.ts";
import type { Material } from "../lib/isometric.ts";

const WATCHED_ATTRIBUTES = ["data-paint", "data-table", "data-corners", "data-module"];

type Palette = Record<Material, Color>;

export interface Tokens {
  palette: Palette;
  cornerScale: number;
  moduleScale: number;
}

function materialColor(host: Element, material: Material): Color {
  const [red, green, blue] = resolveMaterial(host, material);
  return new Color().setRGB(red / 255, green / 255, blue / 255, SRGBColorSpace);
}

function scale(host: Element, property: string, fallback: number): number {
  const value = getComputedStyle(host).getPropertyValue(property).trim();
  return value === "" ? fallback : Number(value);
}

function readTokens(host: Element): Tokens {
  return {
    palette: {
      maple: materialColor(host, "maple"),
      lacquer: materialColor(host, "lacquer"),
      paper: materialColor(host, "paper"),
      ink: materialColor(host, "ink"),
      signal: materialColor(host, "signal"),
    },
    cornerScale: scale(host, "--corner-scale", 1),
    moduleScale: scale(host, "--module-scale", 1),
  };
}

export function useTokens(host: Element, onChange: () => void): Tokens {
  const [tokens, setTokens] = useState(() => readTokens(host));
  useEffect(() => {
    function refresh(): void {
      setTokens(readTokens(host));
      onChange();
    }
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: WATCHED_ATTRIBUTES,
    });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", refresh);
    return () => {
      observer.disconnect();
      scheme.removeEventListener("change", refresh);
    };
  }, [host, onChange]);
  return tokens;
}
