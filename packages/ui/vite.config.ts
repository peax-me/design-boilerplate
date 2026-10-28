import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import { emulateReducedMotion } from "./tests/support/commands.ts";

function chromium() {
  return {
    enabled: true,
    headless: true,
    provider: playwright(),
    instances: [{ browser: "chromium" as const }],
    commands: { emulateReducedMotion },
  };
}

export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-dev-runtime",
      "vitest-browser-react",
      "gsap",
      "gsap/ScrollTrigger",
      "@gsap/react",
      "lenis",
      "@base-ui/react/button",
      "@base-ui/react/separator",
      "@base-ui/react/use-render",
      "@base-ui/react/merge-props",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "lucide-react",
      "three",
      "@react-three/fiber",
    ],
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
    projects: [
      {
        extends: true,
        test: { name: "unit", environment: "node", include: ["tests/**/*.test.ts"] },
      },
      {
        extends: true,
        test: { name: "browser", include: ["tests/**/*.test.tsx"], browser: chromium() },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: ".storybook" })],
        test: { name: "storybook", browser: chromium() },
      },
    ],
  },
});
