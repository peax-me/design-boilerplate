"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "../lib/cn.ts";
import { whenIdle } from "../lib/idle.ts";
import { type PresetGroup, presetGroups } from "../theme/presets.ts";

const moduleGap: Record<string, number> = { compact: 2, standard: 4, roomy: 7 };
const cornerRadius: Record<string, number> = { sharp: 0, soft: 3, round: 9 };
const tableScheme: Record<string, string> = {
  auto: "bg-background",
  day: "scheme-light bg-background",
  night: "scheme-dark bg-background",
};

function ModuleGlyph({ value }: { value: string }) {
  const gap = moduleGap[value] ?? 0;
  return (
    <svg viewBox="0 0 24 12" aria-hidden className="w-6 fill-current">
      <rect x={12 - gap / 2 - 8} y={2} width={8} height={8} />
      <rect x={12 + gap / 2} y={2} width={8} height={8} />
    </svg>
  );
}

function CornerGlyph({ value }: { value: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="w-5 fill-current">
      <rect x={1} y={1} width={18} height={18} rx={cornerRadius[value]} />
    </svg>
  );
}

const glyphs: Record<string, (value: string, label: string) => ReactNode> = {
  "data-paint": () => null,
  "data-face": () => <span className="font-display text-lg">Aa</span>,
  "data-module": (value) => <ModuleGlyph value={value} />,
  "data-corners": (value) => <CornerGlyph value={value} />,
  "data-table": (_value, label) => <span className="text-xs">{label}</span>,
};

const pieceStyle: Record<string, (value: string) => string> = {
  "data-paint": () => "bg-accent",
  "data-face": () => "",
  "data-module": () => "",
  "data-corners": () => "",
  "data-table": (value) =>
    cn("w-auto border border-border px-2 text-foreground", tableScheme[value]),
};

// Face previews download their font; they wait for an idle page so the first paint does not.
const FONT_GROUP = "data-face";

const PIECE =
  "relative flex size-10 cursor-pointer items-center justify-center rounded-md bg-secondary text-secondary-foreground shadow-xs transition has-checked:-translate-y-1 has-checked:outline-2 has-checked:outline-offset-2 has-checked:outline-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: presetGroups.map((group) => group.attribute),
  });
  return () => {
    observer.disconnect();
  };
}

function applyPreset(group: PresetGroup, value: string): void {
  function update(): void {
    document.documentElement.setAttribute(group.attribute, value);
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  document.startViewTransition(update);
}

function usePreviewReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      whenIdle(() => {
        setReady(true);
      }),
    [],
  );
  return ready;
}

function PresetChoice({ group, preview }: { group: PresetGroup; preview: boolean }) {
  const labelId = useId();
  const name = useId();
  const value = useSyncExternalStore(
    subscribe,
    () => document.documentElement.getAttribute(group.attribute) ?? group.defaultValue,
    () => group.defaultValue,
  );
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-xs font-medium text-muted-foreground">
        {group.name}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex gap-2">
        {group.options.map((option) => (
          <label
            key={option.value}
            {...(preview || group.attribute !== FONT_GROUP
              ? { [group.attribute]: option.value }
              : {})}
            className={cn(PIECE, pieceStyle[group.attribute]?.(option.value))}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              aria-label={`${option.label} ${group.name.toLowerCase()}`}
              onChange={() => {
                applyPreset(group, option.value);
              }}
              className="sr-only"
            />
            {glyphs[group.attribute]?.(option.value, option.label)}
          </label>
        ))}
      </div>
    </div>
  );
}

export function TokenTray({
  className,
  "aria-label": label = "Swap a piece",
  ...props
}: HTMLAttributes<HTMLFieldSetElement>) {
  const preview = usePreviewReady();
  return (
    <fieldset
      data-slot="token-tray"
      aria-label={label}
      className={cn(
        "grid grid-cols-2 items-end gap-x-8 gap-y-4 rounded-xl bg-surface p-5 text-foreground shadow-md sm:grid-cols-3",
        className,
      )}
      {...props}
    >
      {presetGroups.map((group) => (
        <PresetChoice key={group.attribute} group={group} preview={preview} />
      ))}
    </fieldset>
  );
}
