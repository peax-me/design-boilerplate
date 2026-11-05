---
name: asset-production
description: Source, generate, post-process and ship visual assets (photos, illustrations, icons, SVG, cut-outs, upscales, video loops, 3D models) through existing files, Magnific stock and Magnific AI generation, tied to DESIGN.md and the theme tokens, with a cost quote (approved by the user, or checked against the 30,000-credit page cap in an autonomous run), a running credit ledger and a provenance record. Use when a plan, page or section needs an image, illustration, icon, poster, video loop or model, or when the user asks to find stock, generate, upscale, remove a background, vectorise or restyle an image.
---

# Asset production

An asset illustrates one beat of the copy; it never replaces copy. Work through four gates: asset list, quote, review, ship.

**Two modes.** In an interactive session the user approves the asset list, the quote and the review, and no credit is spent before the user says yes to a quote. A run started by the `signature-experience` skill from a brief is autonomous (ADR-0028): gates 1 and 3 become self-checks recorded in `DESIGN.md`, and gate 2 becomes a check against the page's cap: a page total at or under 30,000 credits proceeds, above it stops. In both modes each paid call is quoted first, and no call takes the page above the cap.

## 0. Before anything

Read `PRODUCT.md`, `.agents/product-marketing.md`, `DESIGN.md` (direction and references from `design-inspiration`) and `packages/ui/src/styles/theme.css`. If `DESIGN.md` is missing, get the direction first: `design-inspiration` in an autonomous run, `project-kickoff` phase 2 otherwise.

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

**Gate (interactive):** the user approves the list.

**Self-check (autonomous):** write the list under `### Assets` in the page's `## Page: <name>` section of `DESIGN.md`, then check every row against the rules above and against the section plan: the slot supports a beat, the medium and placement are filled in, nothing forbidden is asked of generation (product UI, testimonials, faces, logos, text in images), and no viewport has two focal images. Fix the failing rows, record the result in one line, and go on without waiting.

## 2. Sourcing order

Cheapest and safest first. Record, per slot, why each earlier step failed.

1. **Repository and client files**: `apps/web/src/features/**/images`, `assets/source/**`, the Figma library (`download_assets`).
2. **Icons**: lucide through `Icon`; search `node_modules/lucide-react` before anything else.
3. **Earlier Magnific work** for this project: `creations_search`.
4. **Magnific stock**: `stock_search` with `license`, `orientation`, `color`, and `ai_generated: excluded` for anything shown as real. `content_type: icon` returns SVG. Similar to an approved image: `imageCreationId`. Edit with `stock_to_creation`.
5. **Generation**, only for what the steps above cannot cover.

Choose by cost as well, before the plan is quoted: with the page's `spent` and the cap in view (§3), take the cheapest route that still tells the beat (stock before generation, one call with `count` N before several, 2.5D relief or a still before video). The quote gate does not re-plan (§3).

## 3. Quote and approval (gate 2)

1. `account_balance`, and the page's entry in the ledger (below): what it has `spent` so far.
2. Read the live catalog: `images_models_list { onlyRecommended: true }`, `video_models_list`, `models3d_models_list`. Choose by `agentRecommendation`; never pick a model or a price from memory.
3. `simulate_cost` for every planned call with its exact arguments (`{}` lists the arguments). Upscales are priced by source size: quote them separately. When `simulate_cost` returns a `range`, count its top. A tool that `simulate_cost` does not list, such as `video_finalize_draft`, counts at the price of the equivalent generation at final resolution, an upper bound.
4. Show a table: slot, tool, model and settings, count, credits (with `certainty` or `range`), the quote total, then `spent`, the page total (`spent` plus the quote), the cap and the balance after.
5. **Gate.**
   - Interactive: wait for an explicit yes. The user's yes to the quote table is the explicit yes of ADR-0028 for every call listed in it; a call added later, or one whose argument changes or whose total grows, needs a new yes. A page total above the cap needs the user's explicit decision.
   - Autonomous: do not wait. A page total (`spent` plus the priced plan) at or under 30,000 credits proceeds: record each call in the ledger. Above 30,000 the run stops before the first call and asks, even when a cheaper variant exists. Say what the page has spent, what the plan costs, the total and the cap, and list the options with the cheaper variant first, priced with `simulate_cost` (a cheaper route for the same beat, one beat fewer, a higher cap), so one word answers. Never re-plan or trim the quote at the gate yourself (fewer retries, a lower resolution, another model, shorter shots): that changes what the page shows, which is the user's call. Cost-based choices belong to planning, before the quote (§2).
6. Before each call, check again: `spent` plus the `simulate_cost` of that call stays at or under the cap. After it, append its ledger entry and say in one line: credits used, page total, balance left.

Routes to validate against the live catalog:

| Need                  | Route                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Exploration           | One call with `count` N (or a grid split with `images_split_grid`), never N calls                                                          |
| Photo or illustration | The model ranked first for the medium, 2k                                                                                                  |
| Isolated object       | A model with transparent background, otherwise `images_remove_background`                                                                  |
| Vector                | Stock, then `images_generate_svg`, or a raster traced with `images_to_svg`                                                                 |
| Video loop            | Same start and end keyframe for a seamless silent loop, 6 s at most; model, drafts and seam check (SSIM ≥ 0.95) as in `cinematic-footage` §2 |
| 3D model, scan        | `scene-3d` skill (`models3d_*`, orbit footage for a splat), with this quote and provenance                                                 |

**Ledger.** The running count lives in `assets/provenance.json`, beside the shipped files, so it survives a context reset. The file keeps its `assets` array and gains a `pages` array:

```json
"pages": [
  {
    "page": "<route or feature name>",
    "cap": 30000,
    "spent": 6040,
    "entries": [
      { "tool": "images_generate", "model": "<model>", "slot": "hero", "credits": 140, "basis": "simulate_cost", "date": "YYYY-MM-DD" },
      {
        "tool": "video_finalize_draft",
        "model": "<model>",
        "slot": "journey-1",
        "credits": 5900,
        "basis": "account_balance",
        "balance": { "before": 20100, "after": 14200 },
        "date": "YYYY-MM-DD"
      }
    ]
  }
]
```

- One object per page, created with `cap: 30000` before its first paid call. The cap covers exploration, drafts and retries.
- One entry per paid call, discarded takes and drafts included. Free tools (`account_balance`, `simulate_cost`, `video_view_frames`, `video_analyze`, `video_metadata`, `video_extract_frames`) are not entered.
- `credits` is the `simulate_cost` figure of that call, the top of its `range` when it returns one (`basis: "simulate_cost"`). For a tool `simulate_cost` does not list, read `account_balance` right before and right after the call, record the difference as `credits` and both readings as `balance` (`basis: "account_balance"`).
- `spent` is the sum of the entries' `credits`, rewritten with every append. When a run resumes, recompute it from the entries instead of trusting it.
- The `credits` of a shipped file (§7) count what made that file; the ledger counts everything that was spent.

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

`creations_wait`, then `creations_show`. For each candidate: subject present, focal point and empty side where the layout needs them, no text or logo artefacts, holds up on light and dark grounds. Two misses on one slot: revisit the brief or the source instead of generating again.

**Gate (interactive):** the user picks.

**Self-check (autonomous):** judge each candidate against those criteria with the free tools (`creations_show`, and for video `video_view_frames` and `video_analyze` as in `cinematic-footage` §2), pick the best, and record under `### Assets` in `DESIGN.md`: the slot, the chosen creation, the criteria it met and why it beat the others. A candidate that meets none is a miss: a retry is a paid call, checked against the cap (§3) and entered in the ledger like any other.

## 6. Post-process

In this order, each step only if needed:

1. `images_crop` or `images_expand` to the slot ratio; `images_retouch` for local fixes.
2. `images_remove_background` for cut-outs; check the edges on both grounds.
3. `images_upscale` only when the source is narrower than twice the largest rendered width (faithful mode for photos). Quote it first.
4. `images_to_svg` for flat art only, then SVGO; keep the `viewBox`, replace fills with `currentColor`. Animate SVG with GSAP in `@repo/ui`, never with `images_animate_svg` output.
5. Download the original immediately, URLs expire: `creations_register_download { license: true }` for stock and generations.
6. Raster master: one file per slot, at most twice the largest rendered width (3840 px cap); `next/image` derives AVIF and WebP.
7. Loop: an H.264 MP4 without audio plus a WebM, and the first frame as the poster. Budget: 6 MB a file on desktop and 3 MB on phones, the envelope of `cinematic-footage` §3. Raise `-crf` before lowering the width. A pair over 3 MB gets a second, narrower pair for phones (`-mobile`, 720 px wide, poster not repeated), which the loop component picks with a `media` condition. How the files load is the component's rule (§7).

```bash
master=assets/source/<feature>/<slot>/<slot>.mp4          # a loop that passed the seam check of cinematic-footage §3
loop=apps/web/public/media/<feature>/<slot>-<subject>     # <slot>-<subject>-mobile for the phone pair
width=1280                                                # the slot's rendered width, 1600 at most; 720 for the phone pair
frame=$(mktemp -d)                                        # the PNG intermediate is never versioned
ffmpeg -i "$master" -an -vf "scale=$width:-2:flags=lanczos" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart "$loop.mp4"
ffmpeg -i "$master" -an -vf "scale=$width:-2:flags=lanczos" -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 "$loop.webm"
# the poster: desktop pair only. Skip these two lines for the phone pair, which reuses it: they would overwrite it at 720 px
ffmpeg -i "$master" -frames:v 1 -vf "scale=$width:-2:flags=lanczos" "$frame/first.png"
avifenc --speed 6 --qcolor 65 --yuv 420 --depth 8 "$frame/first.png" apps/web/src/features/<feature>/images/<slot>-poster.avif
```

## 7. Ship

| Asset                                 | Location                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Page image                            | `apps/web/src/features/<feature>/images/<slot>-<subject>[-<scheme>].<ext>`, imported statically                    |
| Video poster (loop, sequence, canvas) | `apps/web/src/features/<feature>/images/<slot>-poster.avif`, imported statically, never under `public/`            |
| Video loop                            | `apps/web/public/media/<feature>/<slot>-<subject>.{mp4,webm}`, and `<slot>-<subject>-mobile.{mp4,webm}` for a phone pair (§6) |
| Frame sequence, scroll clip           | `apps/web/public/media/<feature>/<shot>/` (`cinematic-footage` §3)                                                 |
| 3D model, HDRI, splat                 | `apps/web/public/models/<name>.glb`, `apps/web/public/hdri/<name>.hdr`, `apps/web/public/splats/<name>-<tier>.spz` |
| Social and app icons                  | `opengraph-image.tsx`, `icon.svg`, `apple-icon.png` in `apps/web/src/app/` (code, tokens, real copy)               |
| Brand vector, custom icon             | `packages/ui/src/icons/<name>.tsx`                                                                                 |
| Masters, sources, 3D sources          | `assets/source/<feature>/<slot>/`, `assets/3d/source/` (not shipped)                                               |

- Kebab-case names, no `final`, `new` or `v2`. Replace an approved asset in a reviewed change, never in place.
- Pages never render `<img>` or `<video>` themselves: images go through `Media` (`image={<Image src={…} alt="…" sizes="…" />}`, ADR-0022), statically imported from the feature's `images/` folder. The first video loop adds a loop component to `@repo/ui` (`design-system` skill): poster, `muted`, `playsInline`, a pause control, and the poster alone under reduced motion. ADR-0024 covers it, so no project ADR. The poster paints first as the LCP and the video never competes with it: `preload="none"` below the fold (the component starts it when the loop nears the viewport), `preload="metadata"` above it, never `auto`.
- A loop that only plays is that component, with the files of §6. A loop that needs a WebGL treatment (a dissolve into another shot, a shader grade, a pointer response) is an `ambient` stage built with `cinematic-footage`: its poster follows the table above, whatever the kind.
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

`approvedBy` is `user` after an interactive approval and `autonomous` for a run that passed the self-checks and the cap check. Stock entries record `stockId`, author, `aiGenerated` and licence; client files record owner and licence note; Poly Haven files (CC0) record their URL and slug. AI output carries a commercial licence on paid plans but no legal indemnity, and stock on free plans needs a credit: put it in the footer.

## 8. Verify

`pnpm check`, `pnpm test:e2e` (axe fails a missing `alt`), Lighthouse budgets (LCP image weight, correct `sizes`), then the `design-reviewer` agent in both schemes. In `assets/provenance.json`, every shipped file has an entry and each page's `spent` equals the sum of its entries and stays at or under its `cap`.

## Reference and known conflicts

- `image` (vendored): placement sizes, social images, failure modes. Ignore its Unsplash, Pexels and Canva sources, `<picture>` markup and keyword alt text: stock comes from Magnific, rendering goes through `@repo/ui` and `next/image`.
- `impeccable` generates images through OpenAI with its own key: generate through Magnific instead, then run `impeccable embed-prompt <file> --prompt "<prompt>"` so its record survives.
- Do not use `ui-ux-pro-max` banner or design generators: their dependencies are missing.
- Prompt principles adapted from OpenAI `imagegen` (Apache-2.0), Google's Nano Banana prompting guide, layerai art direction (MIT) and the Magnific MCP tool descriptions.
