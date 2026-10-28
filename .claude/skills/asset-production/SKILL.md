---
name: asset-production
description: Source, generate, post-process and ship visual assets (photos, illustrations, icons, SVG, cut-outs, upscales, video loops, 3D models) through existing files, Magnific stock and Magnific AI generation, tied to DESIGN.md and the theme tokens, with a cost approval and a provenance record. Use when a plan, page or section needs an image, illustration, icon, poster, video loop or model, or when the user asks to find stock, generate, upscale, remove a background, vectorise or restyle an image.
---

# Asset production

An asset illustrates one beat of the copy; it never replaces copy. Work through four gates: asset list, quote, review, ship. Never spend credits before the user says yes to a quote.

## 0. Before anything

Read `PRODUCT.md`, `.agents/product-marketing.md`, `DESIGN.md` (direction and references from `design-inspiration`) and `packages/ui/src/styles/theme.css`. If `DESIGN.md` is missing, run `project-kickoff` phase 2 first.

## 1. Asset list (gate 1)

From the `landing-page` section plan, one row per slot:

| Field       | Content                                                           |
| ----------- | ----------------------------------------------------------------- |
| Slot        | `hero`, `mechanism`, `proof-1`…                                   |
| Beat        | The message it supports                                           |
| Medium      | photo, raster illustration, vector, icon, cut-out, loop, 3D model |
| Placement   | Rendered width per breakpoint (it gives `sizes`) and aspect ratio |
| Scheme      | light, dark or both (does it sit in a `Section scheme="dark"`?)   |
| Composition | Focal point, and the side left empty for copy                     |
| Priority    | LCP, above the fold, or lazy                                      |
| Alt intent  | Decorative, or what it must convey                                |

Rules:

- Product UI comes from real screenshots of the app (Playwright), never from generation.
- Never generate or source testimonials, team photos, faces presented as customers, logos or wordmarks.
- No text in images: copy stays HTML.
- One focal image per viewport (`docs/design/principles.md`).
- Flat brand-coloured illustrations and custom icons are SVG components in `packages/ui/src/icons/` filled with `currentColor` (`design-system` skill), so a retheme recolours them.

**Gate:** the user approves the list.

## 2. Sourcing order

Cheapest and safest first. Record, per slot, why each earlier step failed.

1. **Repository and client files**: `apps/web/src/features/**/images`, `assets/source/**`, the Figma library (`download_assets`).
2. **Icons**: lucide through `Icon`; search `node_modules/lucide-react` before anything else.
3. **Earlier Magnific work** for this project: `creations_search`.
4. **Magnific stock**: `stock_search` with `license`, `orientation`, `color`, and `ai_generated: excluded` for anything shown as real. `content_type: icon` returns SVG. Similar to an approved image: `imageCreationId`. Edit with `stock_to_creation`.
5. **Generation**, only for what the steps above cannot cover.

## 3. Quote and approval (gate 2)

1. `account_balance`.
2. Read the live catalog: `images_models_list { onlyRecommended: true }`, `video_models_list`, `models3d_models_list`. Choose by `agentRecommendation`; never pick a model or a price from memory.
3. `simulate_cost` for every planned call with its exact arguments (`{}` lists the arguments). Upscales are priced by source size: quote them separately.
4. Show a table: slot, tool, model and settings, count, credits (with `certainty` or `range`), total, balance after.
5. **Wait for an explicit yes.** Quote again if any argument changes.
6. After each job, one line: credits used, balance left.

Routes to validate against the live catalog:

| Need                  | Route                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| Exploration           | One call with `count` N (or a grid split with `images_split_grid`), never N calls |
| Photo or illustration | The model ranked first for the medium, 2k                                         |
| Isolated object       | A model with transparent background, otherwise `images_remove_background`         |
| Vector                | Stock, then `images_generate_svg`, or a raster traced with `images_to_svg`        |
| Video loop            | Same start and end keyframe for a seamless silent loop, 6 s at most               |
| 3D model              | `scene-3d` skill (`models3d_*`), with this quote and provenance                   |

## 4. Prompt

Assemble it from files, not taste: 60 to 150 words of plain sentences, in this order.

```text
Purpose: <slot> for <page>, <beat in one line>; shown at <rendered size>, <aspect ratio>.
Subject: <one concrete subject taken from the copy>.
Scene: <setting and moment, said positively ("an empty street", not "no cars")>.
Look: <two to four sentences translating DESIGN.md into production terms: ground, material, light,
      the one signature move ("matte paper grain, soft north-window light", never "stunning, premium")>.
Palette: <only when colour matters: ground, ink and one accent, as hex converted from theme.css>.
Composition: <focal point, empty side for the headline, camera height and distance>.
Constraints: no text, no logos, no watermark, no interface.
```

- Visual facts beat adjectives; a style word needs a visual target.
- Edits say "change only X; keep Y", one change per iteration.
- Follow each model's `instruction` field when it contradicts this template.
- Consistency: the first approved image becomes the style reference (`references: [{ type: "style", … }]`) of every later slot; one model per set; record the seed.
- A Magnific brand kit is a derived mirror like Figma: `theme.css` wins.

## 5. Review (gate 3)

`creations_wait`, then `creations_show`. For each candidate: subject present, focal point and empty side where the layout needs them, no text or logo artefacts, holds up on light and dark grounds. The user picks. Two misses on one slot: revisit the brief or the source instead of generating again.

## 6. Post-process

In this order, each step only if needed:

1. `images_crop` or `images_expand` to the slot ratio; `images_retouch` for local fixes.
2. `images_remove_background` for cut-outs; check the edges on both grounds.
3. `images_upscale` only when the source is narrower than twice the largest rendered width (faithful mode for photos). Quote it first.
4. `images_to_svg` for flat art only, then SVGO; keep the `viewBox`, replace fills with `currentColor`. Animate SVG with GSAP in `@repo/ui`, never with `images_animate_svg` output.
5. Download the original immediately, URLs expire: `creations_register_download { license: true }` for stock and generations.
6. Raster master: one file per slot, at most twice the largest rendered width (3840 px cap); `next/image` derives AVIF and WebP.
7. Loop: H.264 MP4 without audio (`-an -movflags +faststart`) plus WebM, and the first frame as poster.

## 7. Ship

| Asset                        | Location                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Page image                   | `apps/web/src/features/<feature>/images/<slot>-<subject>[-<scheme>].<ext>`, imported statically      |
| Video loop and poster        | `apps/web/public/media/<feature>/<slot>-<subject>.{mp4,webm,avif}`                                   |
| Social and app icons         | `opengraph-image.tsx`, `icon.svg`, `apple-icon.png` in `apps/web/src/app/` (code, tokens, real copy) |
| Brand vector, custom icon    | `packages/ui/src/icons/<name>.tsx`                                                                   |
| Masters, sources, 3D sources | `assets/source/<feature>/<slot>/`, `assets/3d/source/` (not shipped)                                 |

- Kebab-case names, no `final`, `new` or `v2`. Replace an approved asset in a reviewed change, never in place.
- Pages never render `<img>` or `<video>` themselves: images go through `Media` (`image={<Image src={…} alt="…" sizes="…" />}`, ADR-0022), statically imported from the feature's `images/` folder. The first video loop adds a loop component to `@repo/ui` (`design-system` skill, ADR): poster, `muted`, `playsInline`, a pause control, and the poster only under reduced motion.
- LCP image: `loading="eager"` and `fetchPriority="high"` (`priority` is deprecated in Next.js 16).

**Alt text**: decorative images get `alt=""`. Informative ones say, in one sentence, what the image adds in context: no "image of", no keywords, no repeat of the heading. A diagram adds a caption or the data in text. Decorative loops are `aria-hidden`.

**Provenance**: one entry per shipped file in `assets/provenance.json`:

```json
{
  "file": "apps/web/src/features/home/images/hero-workbench.jpg",
  "slot": "hero",
  "source": "generated",
  "origin": {
    "tool": "images_generate",
    "model": "<model>",
    "prompt": "<exact prompt>",
    "seed": 1234,
    "creation": "<id>"
  },
  "edits": ["images_remove_background", "images_upscale"],
  "license": { "type": "magnific-ai-commercial", "plan": "<plan>", "attributionRequired": false },
  "credits": 140,
  "approvedBy": "user",
  "date": "YYYY-MM-DD"
}
```

Stock entries record `stockId`, author, `aiGenerated` and licence; client files record owner and licence note. AI output carries a commercial licence on paid plans but no legal indemnity, and stock on free plans needs a credit: put it in the footer.

## 8. Verify

`pnpm check`, `pnpm test:e2e` (axe fails a missing `alt`), Lighthouse budgets (LCP image weight, correct `sizes`), then the `design-reviewer` agent in both schemes.

## Reference and known conflicts

- `image` (vendored): placement sizes, social images, failure modes. Ignore its Unsplash, Pexels and Canva sources, `<picture>` markup and keyword alt text: stock comes from Magnific, rendering goes through `@repo/ui` and `next/image`.
- `impeccable` generates images through OpenAI with its own key: generate through Magnific instead, then run `impeccable embed-prompt <file> --prompt "<prompt>"` so its record survives.
- Do not use `ui-ux-pro-max` banner or design generators: their dependencies are missing.
- Prompt principles adapted from OpenAI `imagegen` (Apache-2.0), Google's Nano Banana prompting guide, layerai art direction (MIT) and the Magnific MCP tool descriptions.
