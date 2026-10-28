---
name: figma-sync
description: Mirror the code design system and its pages into Figma and link it back with Code Connect. Use when the user wants to push tokens, components or screens to Figma, set up or update Code Connect, check drift between Figma and code, or implement a design proposal made in Figma.
---

# Figma sync

Code is the source of truth (ADR 0013). Figma mirrors it: tokens become variables, components become library components, pages become screens built from those components, and Code Connect shows the real code in Dev Mode. No tool keeps both sides in sync, so every sync is a deliberate run of this skill.

The library file is listed in `packages/ui/AGENTS.md`. Load `figma-use` and `figma-generate-library` before any `use_figma` call, and `figma-use-motion` as soon as the code animates something (scroll scenes, reveals, transitions). Call `create_session` first and never run two `use_figma` calls in parallel. Before improvising a technique, check whether an installed skill already covers it.

## Order

Drift check → tokens → components → screens → Code Connect. Each step only uses what the previous one produced: a screen never contains a value or a component the library lacks.

## File structure

| Page          | Content                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------- |
| `Cover`       | Title and a few library instances                                                             |
| `Foundations` | Every collection and style as specimens bound to the variables they show                      |
| `Components`  | One section per family; each component in a block: title, description, component set         |
| `Prototype`   | One frame per route and device, built from library instances, wired with `figma-prototype`    |

A new component goes into the section of its family; a new family gets a new section. No page per component.

## Tokens (code → variables)

Source: `packages/ui/src/styles/theme.css`.

| Collection   | Modes                       | Variables                                                                                    |
| ------------ | --------------------------- | -------------------------------------------------------------------------------------------- |
| `Color`      | One per scheme and surface  | One per `--color-*`, same name; values read from the raw pair it maps to; a `var(--other)` becomes an alias |
| `Spacing`    | Value                       | `spacing/<step>`; Figma forbids dots, so `0.5` is `spacing/0_5`                              |
| `Radius`     | Value                       | `radius/<step>`                                                                              |
| `Typography` | Desktop, Mobile             | `font/*`, `font-weight/*`, `text/<step>/size`, `line-height`, `letter-spacing`; fluid `clamp()` sizes resolved at 1440 px and 390 px |
| `Presets`    | Value                       | Values a visitor can switch at runtime (theme presets), one variable per value               |

Rules: convert OKLCH to sRGB before writing; scopes on every variable (never `ALL_SCOPES`); WEB code syntax is the CSS variable, e.g. `var(--color-primary)`. Text styles bind font family, style, size, line height and letter spacing to `Typography`; effect styles mirror `--shadow-*`. Scripts are idempotent: look up by name before creating.

## Components (code → library)

Do:

- Mirror every component a page renders, interactive and composite ones included, before building any screen.
- Give each `cva` value its own variant, and mirror the code's API in properties: `TEXT` for strings, `BOOLEAN` + `INSTANCE_SWAP` for optional icons, a `SLOT` for free content. If the code accepts an icon before and after the label, expose both.
- Bind fills, strokes, paddings, gaps, sizes and radii to variables, and put every text on a text style. A weight change inside a text gets the text style of that weight on its range.
- Turn CSS states that matter in prototypes into a `State` variant wired with `ON_HOVER` → `CHANGE_TO` (Smart Animate, 0.2 s).
- Bind every property in every variant, states included: a variant whose label or icon is not bound shows the component's default content as soon as a prototype switches to it. After adding a variant or a property, switch a configured instance through each variant and check that its content stays.
- Seed translucent fills (`bg-primary/85`) with the variable's resolved colour before `setBoundVariableForPaint`; otherwise Figma renders the black seed.
- Bind values switched at runtime to the `Presets` collection.
- Write purpose and usage in the `description`, then compare one screenshot per component set with its Storybook story.

Don't:

- Hard-code a colour, size or font, even one equal to the token value.
- Set a font on top of a text style: it unlinks the style. Change the style instead.
- Fake a drawing the code computes from props (canvas, 3D, generated SVG) as vectors: the hosting component shows it as an exported image.

## Screens (code → Figma)

Do:

- Rebuild each screen by hand from the code: read the route, its sections and the props they pass, then compose auto-layout frames whose padding, gap, width and colours come from the layout components' tokens, filled with library instances and styled text.
- Make one frame per device, 1440 and 390 wide, the mobile one in the `Mobile` mode of `Typography`. A section that switches scheme or surface sets the matching explicit mode of `Color`.
- Compare with the running app as visitors see it (default motion, default colour scheme), section by section; heights should match within a few pixels.
- Export what the code draws at runtime (canvas, 3D, generated SVG) as 2x renders and place them as images. That is the only thing taken from the browser. Make page and section backgrounds transparent before exporting, or the background (grid, colour) gets baked into every image.
- Mirror the layout rules of the code, not just its values: a component in a grid cell fills the cell, cells in a row share the row height, and a reversed flex stack (`flex-col-reverse`) packs its content at the bottom.
- Let single-line texts hug and multi-line texts fill their column: Figma's font metrics are slightly wider than the browser's, so a filling single line wraps where the page does not.
- Round fixed widths down in wrapping rows so a row never breaks on a fraction of a pixel.
- Rebuild motion the code plays (scroll scenes, staged reveals) with Figma Motion (`figma-use-motion`): one layer per moving piece, keyframes and easings taken from the choreography code and the motion tokens, offsets computed from the same geometry the code uses. Figma has no scroll trigger, so the scene plays on the screen's timeline; scrubbing it in the editor stands for scrolling. Put the keyframed layers in the screen frame itself: an instance does not play past its component's default timeline length. Check the motion by exporting a video (`export_video`) and reading one frame per phase.

Don't:

- Capture or import the page into Figma (`generate_figma_design`, `html_to_figma`, pasted screenshots). It produces raw layers, binds colours to whichever token shares the value, drops outlines, background patterns and images, and freezes one motion state.
- Copy layout values from the browser: they come from the tokens the code uses.
- Detach or locally restyle an instance to match the app: fix the component.
- Show a scene in its reduced-motion fallback when the page animates it for most visitors: build the animated version.

## Code Connect

Templates live in `packages/ui/figma/`, one per component and one per icon (parserless format, `figma.code` tagged templates). They are linted and type-checked like the rest of the code.

1. Add or update the template whenever a component, its props or its Figma properties change.
2. Publish with the Figma MCP tool `send_code_connect_mappings` (template content + `templateDataJson` with `isParserless: true`), or with `pnpm --filter @repo/ui exec figma connect publish` and a `FIGMA_ACCESS_TOKEN`.
3. Publishing requires the library to live in a Figma Organization or Enterprise workspace. On a Professional team Figma answers "Code connections can only be made in libraries that are in Organization or Enterprise plans"; keep the templates and publish once the file moves.

## Figma → code

A change made in Figma is a proposal:

1. `figma-design-to-code` reads the frame.
2. Map every value to an existing token or component. If none fits, extend the system in code (`design-system` skill), never hard-code.
3. Re-run the token, component and screen steps so Figma reflects the code again.

## Drift check

Compare every layer and report one table: up to date, drifted, missing in Figma, Figma-only.

1. Variables: names and resolved values in every mode against `theme.css`.
2. Styles: text and effect styles against the type scale and shadows.
3. Components: each component in `packages/ui` against its component set (variants, properties, bindings in every variant), and components with no Figma counterpart.
4. Screens: each route against its frames (sections, copy) and whether they are built from library instances.

Code wins; report Figma-only changes to the user as proposals.
