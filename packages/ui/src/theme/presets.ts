interface PresetOption {
  value: string;
  label: string;
}

export interface PresetGroup {
  name: string;
  attribute: `data-${string}`;
  defaultValue: string;
  options: PresetOption[];
}

export const presetGroups: PresetGroup[] = [
  {
    name: "Paint",
    attribute: "data-paint",
    defaultValue: "yellow",
    options: [
      { value: "yellow", label: "Yellow" },
      { value: "green", label: "Green" },
      { value: "orange", label: "Orange" },
      { value: "sky", label: "Sky" },
    ],
  },
  {
    name: "Face",
    attribute: "data-face",
    defaultValue: "geometric",
    options: [
      { value: "geometric", label: "Geometric" },
      { value: "grotesque", label: "Grotesque" },
      { value: "slab", label: "Slab" },
    ],
  },
  {
    name: "Module",
    attribute: "data-module",
    defaultValue: "standard",
    options: [
      { value: "standard", label: "Standard" },
      { value: "compact", label: "Compact" },
      { value: "roomy", label: "Roomy" },
    ],
  },
  {
    name: "Corners",
    attribute: "data-corners",
    defaultValue: "soft",
    options: [
      { value: "soft", label: "Soft" },
      { value: "sharp", label: "Sharp" },
      { value: "round", label: "Round" },
    ],
  },
  {
    name: "Table",
    attribute: "data-table",
    defaultValue: "auto",
    options: [
      { value: "auto", label: "Auto" },
      { value: "day", label: "Day" },
      { value: "night", label: "Night" },
    ],
  },
];
