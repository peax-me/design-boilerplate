# Design Boilerplate

Starting point for every new project: a Turborepo with a Next.js front end and a design system that agents cannot drift from. Tokens live in code, lint blocks anything off-scale, a browser audit checks every page, Figma mirrors the code.

## Commands

| Command                              | What it does                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `pnpm dev`                           | Next.js app (`PORT`, default 3000) and Storybook (`STORYBOOK_PORT`, default 6006) |
| `pnpm check`                         | Format check, lint, types, tests with coverage, dead code, ADR gate               |
| `pnpm test:e2e`                      | Production build + WCAG 2.2 AA and design-token audit in the browser              |
| `pnpm --filter @repo/web lighthouse` | Lighthouse on every route, mobile then desktop (performance ≥ 0.95, others = 1)   |
| `pnpm --filter <package> test`       | Tests of one package; one file: `pnpm --filter <package> exec vitest run <path>`  |
| `pnpm format` / `pnpm lint:fix`      | Fix formatting and auto-fixable lint                                              |

## Map

| Path                         | Role                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web`                   | Next.js 16 site. Composes `@repo/ui` only. See `apps/web/AGENTS.md`                        |
| `packages/ui`                | Design system: tokens, layout, typography, components, motion. See `packages/ui/AGENTS.md` |
| `packages/design-audit`      | In-browser design audit used by the e2e tests                                              |
| `packages/typescript-config` | Shared strict `tsconfig` presets                                                           |
| `tooling`                    | ADR gate and Claude Code hooks                                                             |
| `docs/adr`                   | Architecture Decision Records                                                              |
| `docs/design/principles.md`  | Design rules tooling cannot check                                                          |
| `.claude/skills`             | Project skills (vendored ones are pinned in `skills-lock.json`)                            |

## Golden rules

1. **Apps never style.** No `className`, no `style` in `apps/*`. Compose `@repo/ui` and pick props. A missing visual becomes a variant, component or token in `packages/ui` (`design-system` skill).
2. **Tokens live only in `packages/ui/src/styles/theme.css`.** The theme is locked: arbitrary values, margins, single-side paddings and off-scale values fail lint.
3. **Tests first.** Red, green, refactor (`tdd` skill). Tests live in `tests/` or `e2e/`, never next to sources. Coverage thresholds are enforced.
4. **Every technical decision gets an ADR** with `status: proposed` (`adr` skill): technologies, libraries, skills, MCP servers, tooling, patterns, configuration. Design choices (direction, palette, fonts, layout, copy of a page) never get one; they live in `DESIGN.md` and `theme.css`. Only a human accepts an ADR; a hook blocks you and CI stays red until they do.
5. **Code style is enforced, not suggested:** early returns, `return await` only inside `try`, no nested ternaries, named exports, kebab-case files, explicit names (no abbreviations). Read lint errors, fix the cause, never disable a rule without a reason in the comment.
6. **No dead code, no speculative code.** `knip` fails on unused files, exports and dependencies.
7. **Next.js 16 differs from your training data.** Read `apps/web/node_modules/next/dist/docs/` before writing Next.js code.

## Skill routing

Project skills win over everything else. Vendored skills are references; when one contradicts the golden rules, the rules win.

| Task                                        | Skills, in order                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| New project                                 | `project-kickoff`                                                                 |
| Landing or marketing page                   | `landing-page` → `copywriting`, `cro`, `copy-editing`, `marketing-psychology`     |
| Premium animated page from a brief          | `signature-experience`                                                            |
| Motion direction, transitions, choreography | `motion-design` → `scroll-storytelling`, `emil-design-eng`                        |
| Scroll animation                            | `scroll-storytelling` → `gsap-*`, `review-animations`                             |
| Shader or post-processing look              | `shader-craft` → `threejs-shaders`, `threejs-postprocessing`                      |
| Particles                                   | `gpu-particles` → `threejs-shaders`                                               |
| AI footage in a scroll                      | `cinematic-footage` → `asset-production`                                          |
| 3D model, 3D scene or splat                 | `scene-3d` → `threejs-*`, `gsap-scrolltrigger`                                    |
| Review motion                               | `motion-review`, then the `design-reviewer` agent                                 |
| Image, icon, cut-out, video loop            | `asset-production` → `image`, Magnific MCP                                        |
| New token, variant or component             | `design-system` → `shadcn`, `vercel-composition-patterns`                         |
| Inspiration, references, new direction      | `design-inspiration` → `impeccable` (`shape`)                                     |
| Design judgment (critique, polish)          | `impeccable`, `emil-design-eng`, then the `design-reviewer` agent                 |
| Figma library, screens, Code Connect        | `figma-sync` → `figma-use`, `figma-generate-library`, `figma-use-motion`          |
| Figma prototype (flows, interactions)       | `figma-prototype` → `figma-use`, `figma-use-motion`                               |
| React and Next.js performance               | `vercel-react-best-practices`, `next-cache-components-*`, `next-bundle-optimizer` |
| Decision record                             | `adr`                                                                             |

Known conflicts, resolved: tokens never go in `DESIGN.md` (`impeccable`, `shadcn`); pages never use `className` (`shadcn`); GSAP is the only animation library, no Motion/framer-motion (`emil-design-eng`, `review-animations`); GSAP code lives in lazy modules of `packages/ui` rendered inside `AfterIdle`, never in a page or a component of the first load, and a page only drives the timeline a scene hands it (the `gsap-react` and `gsap-*` examples that import `gsap` or call `useGSAP` in components); Figma Motion (`figma-use-motion`) only animates Figma screens, never code; route transitions use React `<ViewTransition>`, not CSS keyframes outside the design system (`vercel-react-view-transitions`); assets come from Magnific, never from Unsplash, Pexels or Canva, and render through `@repo/ui` (`image`); images are generated through Magnific, not impeccable's OpenAI key (`impeccable`); `ui-ux-pro-max` banner and design generators are not used; vanilla renderers and `EffectComposer` setups in the `threejs-*` skills give way to `StageCanvas` (`packages/ui/src/scene/stage-canvas.tsx`) and `@react-three/postprocessing`, and their continuous render loops to the GSAP ticker clock; the WebGPU/TSL sections of those skills (`three/webgpu`, `WebGPURenderer`, `RenderPipeline`) are ignored because WebGL2 is the engine, except past one million particles (ADR 0024); CDN import maps give way to the pinned `three` dependency; DOM mounting, inline cursor styles and fixed pixel-ratio caps give way to `StageCanvas` and its tier pixel ratios; camera controls never capture page scroll (no wheel zoom on scroll-driven pages).

## Conductor

`.conductor/settings.toml` installs each workspace and gives it its own ports: run the `dev`, `check` and `e2e` actions instead of fixed ports (ADR 0017).

## Deploy

`.github/workflows/pages.yml` publishes a static export of `apps/web` to GitHub Pages once CI passes on `main` (ADR 0023). Public files referenced by string go through `process.env.NEXT_PUBLIC_BASE_PATH`; test an export locally with `PAGES_BASE_PATH=/<repo> pnpm --filter @repo/web build`.

## Hooks

After every edit, the file is formatted and linted; errors block you until fixed. Writing `status: accepted` or `rejected` in an ADR is blocked.

## Definition of done

- `pnpm check` and `pnpm test:e2e` pass, the motion audit included: no blank or frozen canvas, no WebGL or shader error, no canvas under reduced motion.
- `pnpm --filter @repo/web lighthouse` passes on mobile and desktop for every route.
- Signature scenes pass `motion-review`: every criterion of its grid scores 4 or more, or is N/A where the grid allows it.
- New routes are listed in `apps/web/e2e/support/routes.ts`.
- New components have stories and appear in `packages/ui/AGENTS.md`.
- New decisions have a proposed ADR.
- UI changes were reviewed by the `design-reviewer` agent.
