import type { Material } from "./isometric.ts";

type Rgb = [number, number, number];

function toRgb(color: string): Rgb {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (context === null) {
    return [0, 0, 0];
  }
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
  return [red, green, blue];
}

export function resolveMaterial(host: Element, material: Material): Rgb {
  const probe = document.createElement("span");
  probe.style.color = `var(--${material})`;
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return toRgb(color);
}
