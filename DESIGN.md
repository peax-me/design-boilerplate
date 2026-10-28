# Design direction

Values live in `packages/ui/src/styles/theme.css`; this file holds the direction only.

## Point of view

Every page is built from one box of blocks. The world is Friedrich Fröbel's building gifts (1837), the wooden blocks that shaped the Bauhaus: a painted table incised with a grid, natural maple pieces, a few lacquered ones. A piece that is not in the box cannot be placed, which is exactly what the design system does to agents.

## The world

- **Ground:** the painted table. Ultramarine by day, ink by night, with its grid always on the same module, so every scene shares one registration.
- **Pieces:** materials, not roles: maple for structure, lacquer (the accent paint) for the one thing that matters, paper for text-bearing slabs, ink for the tray, signal for a flagged renegade. Every piece shows the same generated maple grain, under its finish, and keeps its material on any ground.
- **Sheet:** instruction-booklet paper with ink and ultramarine print, for reading-heavy sections.
- **Type:** a constructed geometric display face set on the block module for headings; a neutral grotesque for text; the system monospace for code.
- **Controls:** buttons are maple planks with a visible edge; the token tray is the box's lid, holding the pieces a visitor may swap.
- **Motion:** pieces drop, glide and snap. Renegade pieces drift off the grid and are pulled back to the nearest token. Scroll scenes are scrubbed with in-out easing; nothing jumps.
- **3D:** one isometric camera for vector drawings and the three.js stage, so the drawing and the scene are the same picture.

## Do

- Show the system working: swaps, snaps and counts read from the repository.
- Let token presets reach everything: DOM, vector drawings and 3D blocks.
- Keep one focal piece per viewport and one lacquer accent per view.

## Don't

- Toy-brand cuteness: no faces on blocks, no rounded bubbly type, no rainbow palettes.
- Decoration that explains nothing; every animated piece stands for a token, a rule or a component.
- Category defaults: dark glow heroes, bento grids, gradient text.

## References

| Reference                                                  | Principle taken                                        | Not taken              |
| ---------------------------------------------------------- | ------------------------------------------------------ | ---------------------- |
| Fröbel gifts (building blocks and gridded table, 1837)     | A fixed kit composes anything; the grid is the measure | Children's-toy styling |
| Botanical folio plates at fixed scale (impeccable catalog) | One camera and one registration across every stage     | Cream paper and serif  |
| Alphabet storm (impeccable catalog)                        | Type obeys the same law as the pieces                  | Letters as weather     |
| Raku firing stages (impeccable catalog)                    | Every stage of a process readable as a still plate     | Celebrating accident   |
| Ebru floated pigment (impeccable catalog)                  | A change visibly displaces what is built on it         | Organic marbling       |
| Nixie laboratory counter (impeccable catalog)              | Figures are measurements bound to a real source        | Retro glow             |

The direction was chosen on impeccable's decision page (seed `seed:138ead1a38d21646`); the direction contract lives in `apps/web/.impeccable/surfaces/apps-web-src-app-page-tsx.md`.
