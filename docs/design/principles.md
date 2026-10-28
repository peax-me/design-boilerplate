# Design principles

The rules every interface in this repository follows. Tooling enforces what it can (locked theme, lint, browser audit); this document covers the judgment calls. Values live in `packages/ui/src/styles/theme.css`; this file never restates them.

## 1. Compose, never invent

- Pages compose `@repo/ui` components and choose among their typed props. Apps have no `className` or `style`.
- A need the design system cannot express becomes a new variant, component or token in `packages/ui`, reviewed like any other code. Never a local workaround.
- Prefer an existing component over a new one, a new variant over a new component, a new component over a new token.

## 2. Space creates structure

Spacing comes only from `gap` (Stack, Inline, Grid) and padding (Section, Container, Card). Margins do not exist.

| Relationship                    | Gap step            |
| ------------------------------- | ------------------- |
| Inside a control (icon + label) | `2xs`–`xs`          |
| Related elements (title + text) | `sm`–`md`           |
| Elements of one group           | `md`–`lg`           |
| Distinct groups in a section    | `xl`–`2xl`          |
| Sections                        | `Section` `spacing` |

- Proximity: the space inside a group is always smaller than the space between groups. If two gaps look equal, the grouping is ambiguous.
- Symmetry: paddings are symmetric on each axis (`px`, `py`). Alignment is shared: siblings start on the same edge or share the same centre.
- One rhythm per section: a section uses one or two gap steps, not five.

## 3. Hierarchy

- One focal point per viewport. On a landing page, the first viewport states the offer and exposes one primary action.
- Heading `level` follows the document outline; heading `size` follows the visual hierarchy. Keep at least two steps of the type scale between a heading and its body text.
- One primary action per view. Secondary actions use `outline` or `ghost`.
- Emphasis is rationed: `accent` colour marks the one thing that matters on screen.

## 4. Typography

- Body text lines stay between 45 and 75 characters: wrap long text in `Container size="prose"` or `narrow`.
- Headings balance their lines, paragraphs avoid orphans (handled in the base layer). Never force line breaks with markup.
- Muted tone is for supporting text, never for content the visitor must read to act.

## 5. Colour and contrast

- Use semantic roles (`foreground`, `muted-foreground`, `primary`, `accent`, `border`), never raw colours.
- Text and controls meet WCAG 2.2 AA contrast in light and dark schemes. The browser audit checks both.
- Dark sections use `Section scheme="dark"` so every token flips together.

## 6. Interaction

- Interactive targets are at least 24×24 px (WCAG 2.5.8) and 40 px tall for primary actions (`Button size="md"` or larger).
- Navigation is a link (`ButtonLink`, `TextLink`); an action is a button (`Button`). Never a button that navigates.
- Every interactive element has a visible focus state (provided by the base layer; do not remove it).

## 7. Motion

- Motion explains: it shows sequence, cause or continuity. If it explains nothing, it does not ship.
- Budget per landing page: two or three scroll scenes, one signature moment, calm everywhere else. No fade-up on every section.
- Author the final state in markup and animate from an offset, so reduced motion shows a complete page.
- Animate `transform` and `opacity` only. Durations and easings come from `@repo/ui/motion/tokens`.

## 8. Content

- Real copy from the first draft: no lorem ipsum, no invented metrics, no placeholder logos.
- Claims need proof on the page (figures with sources, named customers, demonstrations).
