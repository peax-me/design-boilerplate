---
name: design-inspiration
description: Gather references and turn them into an original visual direction instead of a default look. Use when starting a visual direction, redesigning, when the user asks for inspiration, references, a mood board, something more original or innovative, or when a design feels generic. An autonomous run (started by the `signature-experience` skill from a brief) uses it too and chooses the direction itself.
---

# Design inspiration

Inspiration exists to escape the default, not to copy. Collect references, extract one principle from each, then combine principles into two or three directions the user chooses from. In an autonomous run (started by the `signature-experience` skill from a brief, ADR-0028) nobody chooses: the agent decides with the tests of §5 and logs its reasons.

## 1. Frame the search

From `PRODUCT.md` and `.agents/product-marketing.md`, write: the feeling the visitor should have, three words for the brand, and what the page must never look like. Search for that, not for "landing page".

## 2. Sources, in order

1. **impeccable** `shape` / new-work: deals concepts outside the usual patterns; start here to avoid category clichés.
2. **Are.na** (free MCP, user scope: `claude mcp add --transport http --scope user arena https://mcp.are.na/mcp`): human-curated boards for art direction, type, materials, photography.
3. **Refero** (paid MCP, if the user subscribes: `claude mcp add --transport http --scope user refero https://api.refero.design/mcp`): real product screens and flows. Use the MCP only; its bundled skill conflicts with this repository's rules.
4. **Playwright** on URLs the user or you pick: screenshots and scroll recordings to study motion, which galleries cannot show. Visit pages normally; never scrape galleries that block crawlers.
5. **Magnific** `images_generate` for mood frames once a direction emerges, through the quote gate of `asset-production`. In an autonomous run the gate is the cap check, and mood frames are exploration: they go in the ledger of the page the run builds.

In an autonomous run, use the sources already installed and note in `DESIGN.md` which ones were unavailable: never install a user-scope MCP or subscribe to a service for it. `impeccable` `shape` only returns a brief and stops, so the directions come from `new-work`, through its `concept-seed` script. Do not serve the decision page or wait on it. Answer `new-work`'s questions from the brief, `PRODUCT.md` and `.agents/product-marketing.md`, log each assumption under `## Decisions`, pick with the four tests of §5, and go on.

## 3. Build the board

6 to 12 references. For each: link or file, what to take (one principle: a type contrast, a grid tension, a motion idea, a material), and what not to take. Keep the board in `DESIGN.md` under "References" so the direction stays traceable.

## 4. Turn it into directions

Propose two or three directions, each with: a one-line point of view, the principles it combines, type pairing, colour intent, motion personality, and one hero sketch (described or generated). The user picks; then `design-system` translates the chosen direction into tokens. In an autonomous run, §5 picks.

## 5. Autonomous run: choose and log

Do not wait for a pick. Test each direction against four questions, each answered yes or no:

1. Does it produce the feeling written in §1?
2. Does it avoid what the page must never look like (§1)?
3. Is it distinct from its category's default, so that another brand of the category could not ship it unchanged?
4. Can the design system carry it: tokens in `theme.css`, the motion budget of `scroll-storytelling`, no layout, illustration or copy borrowed?

Take the direction that passes all four. If several do, take the one with the most distinctive motion personality, since that is where the signature moment comes from. If none does, rewrite the weakest direction once to fix its failed test and test again; then take the best score. Never ask.

Record the result in `DESIGN.md`: the chosen direction as direction only (point of view, references, do and don't; token values stay in `theme.css`), and one entry under `## Decisions`: what was chosen, over which directions, the test each rejected one failed, and why the chosen one wins. A later reader, or the user, can then audit the choice.

## Rules

- Borrow principles, never layouts, illustrations, logos or copy.
- A reference without a stated principle does not go on the board.
- Credit sources in `DESIGN.md`; respect each site's terms of use.
