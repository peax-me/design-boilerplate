---
name: design-inspiration
description: Gather references and turn them into an original visual direction instead of a default look. Use when starting a visual direction, redesigning, when the user asks for inspiration, references, a mood board, something more original or innovative, or when a design feels generic.
---

# Design inspiration

Inspiration exists to escape the default, not to copy. Collect references, extract one principle from each, then combine principles into two or three directions the user chooses from.

## 1. Frame the search

From `PRODUCT.md` and `.agents/product-marketing.md`, write: the feeling the visitor should have, three words for the brand, and what the page must never look like. Search for that, not for "landing page".

## 2. Sources, in order

1. **impeccable** `shape` / new-work: deals concepts outside the usual patterns; start here to avoid category clichés.
2. **Are.na** (free MCP, user scope: `claude mcp add --transport http --scope user arena https://mcp.are.na/mcp`): human-curated boards for art direction, type, materials, photography.
3. **Refero** (paid MCP, if the user subscribes: `claude mcp add --transport http --scope user refero https://api.refero.design/mcp`): real product screens and flows. Use the MCP only; its bundled skill conflicts with this repository's rules.
4. **Playwright** on URLs the user or you pick: screenshots and scroll recordings to study motion, which galleries cannot show. Visit pages normally; never scrape galleries that block crawlers.
5. **Magnific** `images_generate` for mood frames once a direction emerges, through the quote gate of `asset-production`.

## 3. Build the board

6 to 12 references. For each: link or file, what to take (one principle: a type contrast, a grid tension, a motion idea, a material), and what not to take. Keep the board in `DESIGN.md` under "References" so the direction stays traceable.

## 4. Turn it into directions

Propose two or three directions, each with: a one-line point of view, the principles it combines, type pairing, colour intent, motion personality, and one hero sketch (described or generated). The user picks; then `design-system` translates the chosen direction into tokens.

## Rules

- Borrow principles, never layouts, illustrations, logos or copy.
- A reference without a stated principle does not go on the board.
- Credit sources in `DESIGN.md`; respect each site's terms of use.
