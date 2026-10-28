---
name: figma-prototype
description: Turn Figma screens into a clickable, testable prototype like an expert product designer — navigation, scroll-to anchors, overlays and modals, hover and press states, variant changes, smart animate, fixed elements, flows and stateful logic with variables. Use when the user asks for a prototype, interactions, a clickable mockup, a user test, a flow, "when I click here it opens…", or a demo of the design in Figma.
---

# Figma prototype

A prototype answers a question ("can people find pricing?", "does onboarding feel fast?"). Start from that question, wire only the paths it needs, and make every interaction behave like the coded product.

Load `figma-use` before any `use_figma` call, reuse the session from `create_session`, and never run two `use_figma` calls in parallel. Screens are built by hand from library instances (`figma-sync`, Screens) before any wiring: a captured, imported or detached screen has no component states and no tokens, so rebuild it instead of wiring it. API shapes, helpers and the lint script are in [references/snippets.md](references/snippets.md).

## 1. Plan the interaction map

Write it and get the user's approval before wiring:

```
Question: <what the test must answer>
Flows: <name> — starts on <frame>, device <desktop 1440 | mobile 390>
Path: <frame> --(trigger on layer)--> <action> <destination> (<transition>)
States: <component variants or prototype variables needed>
UI-only steps: <overlay settings, sticky elements the user must set>
```

Interactions mirror the code: destinations match routes and anchors, component states match the CSS, timings come from `@repo/ui/motion/tokens` (`fast` 0.2 s, `base` 0.45 s, `slow` 0.8 s) and easings from the theme (`--ease-standard` = cubic-bezier(0.2, 0, 0, 1), `--ease-emphasized` = cubic-bezier(0.16, 1, 0.3, 1)).

## 2. Build order

1. **Interactive components.** Add the needed `State` variants to the component set (`Default`, `Hover`, `Pressed`, `Open`…) and wire them on the variant components with `CHANGE_TO`: `ON_HOVER` and `ON_PRESS` revert automatically, `ON_CLICK` for toggles (wire both directions). Every instance inherits the behaviour.
2. **Screens.** Navigate, overlay, swap, scroll-to, back, URL, timed steps (`AFTER_TIMEOUT`), keyboard (`ON_KEY_DOWN`, Escape = 27).
3. **Scroll.** Top-level frames taller than the device scroll on their own. Nested carousels: `clipsContent = true` + `overflowDirection`. Fixed header: `numberOfFixedChildren` on the screen [unverified which children become fixed; read back].
4. **State.** Toggles, tabs, carts and form steps use variables in a `Prototype` collection (never in the token collections): `SET_VARIABLE`, `CONDITIONAL`, `SET_VARIABLE_MODE` (light/dark theme, desktop/mobile type), with layer visibility or text bound to the variable.
5. **Flows.** `page.flowStartingPoints = [{ nodeId, name }]`, one flow per device. Mobile frames set `setExplicitVariableModeForCollection(typography, mobileModeId)` so fluid type matches the code.

## 3. Rules that prevent broken prototypes

1. Write with `await node.setReactionsAsync([...])`; the setter is read-only and the call **replaces** every reaction on the layer. Read, merge, write (`upsertReaction` helper). One reaction per trigger per layer; put several actions in `actions[]`.
2. `SCROLL_TO` takes `{ type: "SCROLL_ANIMATE", easing, duration }` (verified: `SMART_ANIMATE` is rejected). Directional transitions (`MOVE_IN`, `PUSH`, `SLIDE_IN`…) need a `matchLayers` key; `SMART_ANIMATE`/`DISSOLVE` must not have one.
3. Overlays, swap and close cannot use smart animate (use `DISSOLVE` or `MOVE_IN`). `BACK` ignores any transition.
4. **Never call `setReactionsAsync` on an instance of an interactive component**, not even to write back the same list: the instance's states freeze. Put the instance's own click on a wrapper frame (hotspot) around it; the click passes through the instance because it only handles hover.
5. `CHANGE_TO` targets a sibling variant of the current one, never the same variant.
6. `CONDITIONAL`: the last block without `condition` is the else branch; else-if chains collapse to one if/else. Use separate variables for multi-way logic.
7. Smart animate pairs layers by name and hierarchy: keep names identical between states.
8. Durations are seconds. `AFTER_TIMEOUT.timeout` reads back in seconds in real files although the docs say milliseconds: read it back after writing.

## 4. UI-only steps (hand these to the user with exact frame names)

The Plugin API cannot write them:

- Overlay settings per modal frame: position, background dim, close on click outside. An `OVERLAY` reaction can be rejected until the destination frame has been set as an overlay once in the Prototype panel.
- "Stick to top" sticky elements.
- Device and model, link-sharing permissions.

## 5. Verify and share

1. Run the lint from the references: broken destinations, `CHANGE_TO` targets outside a component set, screens unreachable from a flow, overlays without a way to close. Fix every issue.
2. Screenshot the start frame of each flow.
3. Give the user the link and the path to try: `https://www.figma.com/proto/<fileKey>/<slug>?node-id=<start-id with ->&starting-point-node-id=<start-id>&scaling=scale-down&content-scaling=fixed&show-proto-sidebar=1`. The MCP cannot play a prototype; final sign-off is the user in Present mode.

## 6. Do and don't

Do:

- Take every destination from the code: routes for navigation, section ids for scroll-to, the shared link constants for URLs.
- Wire every link the page renders, on each device frame, so both flows behave the same.
- Wire states once on the component set; instances inherit them.
- Mirror animations the code plays with Figma Motion (`figma-use-motion`, rules in `figma-sync`, Screens); this skill only adds the triggers around them (hover, click, scroll-to).

Don't:

- Wire a layer that is not a library instance or a hotspot around one.
- Invent an interaction the code does not have, or leave one the code has unwired.
- Rebuild a screen inside this skill: fix it with `figma-sync`, then come back to wire it.
