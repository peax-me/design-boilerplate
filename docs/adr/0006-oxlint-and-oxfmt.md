---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0006. Oxlint and Oxfmt for linting and formatting

## Context and problem statement

Code quality must be enforced by tooling, not by review. Lint and format run after every agent edit (ADR-0014), on staged files (ADR-0015) and in CI (ADR-0016), so speed matters. Type-aware rules are required, and TypeScript 7 (ADR-0005) rules out tools built on the TypeScript JavaScript API: typescript-eslint 8.72 supports TypeScript `<6.1` only. We also need rules that enforce the design system inside Tailwind class strings (ADR-0007). Which linter and formatter do we use?

## Decision drivers

- Type-aware rules that work with TypeScript 7.
- Fast enough to run after every edit.
- Broad coverage: TypeScript, React and React Compiler, accessibility, Next.js, imports, promises, tests.
- Ability to run `eslint-plugin-better-tailwindcss` for design-system enforcement.
- Prettier-compatible formatting with Tailwind class and import sorting.

## Considered options

- Oxlint (type-aware) + Oxfmt
- ESLint 10 + typescript-eslint + Prettier
- Biome 2

## Decision outcome

Chosen option: "Oxlint (type-aware) + Oxfmt".

- Oxlint 1.90 with `--type-aware`: type-aware rules run on tsgolint (`oxlint-tsgolint`), built on TypeScript 7.
- About 870 rules, including typescript, unicorn, react (with all React Compiler rules: purity, refs, immutability, set-state-in-render, static-components, …), jsx-a11y, nextjs, import, promise and vitest.
- JS plugin support runs `eslint-plugin-better-tailwindcss` (ADR-0007).
- Oxfmt 0.75: Prettier-compatible output, native Tailwind class sorting (`sortTailwindcss`) and import sorting.
- `pnpm lint` runs `oxlint --type-aware --deny-warnings`: a warning fails like an error.

Code-style policy (examples):

| Concern                        | Rules                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Early returns, shallow nesting | `no-else-return`, `no-lonely-if`, `max-depth`                                                         |
| Async correctness              | `return-await: in-try-catch` (required inside try/catch, forbidden elsewhere), `no-floating-promises` |
| Explicit conditions            | `strict-boolean-expressions`, `switch-exhaustiveness-check`, no nested ternaries                      |
| Imports and exports            | `consistent-type-imports`; no default exports except where a framework requires them                  |
| Size limits                    | `complexity`, `max-params`                                                                            |

ESLint with typescript-eslint is blocked by TypeScript 7. Biome 2 has fewer rules, no comparable type-aware depth, and no equivalent of the Tailwind design-system rules.

### Consequences

- Good, because one fast linter covers type-aware, React Compiler, accessibility and design-system rules.
- Good, because formatting and class/import ordering never come up in review.
- Bad, because design-system enforcement depends on Oxlint's compatibility with an ESLint plugin; the combination is verified on Oxlint 1.90 with better-tailwindcss 4.10 only, so each upgrade must be re-verified.
- Bad, because Oxlint does not implement every ESLint core or plugin rule; a rule it lacks cannot be enforced.
- Bad, because Oxfmt is pre-1.0; an upgrade may reformat files.
- Bad, because `oxlint-tsgolint` is a separate package that must stay in step with TypeScript 7.

## More information

- Oxlint: https://oxc.rs/docs/guide/usage/linter.html
- Type-aware linting: https://oxc.rs/docs/guide/usage/linter/type-aware.html
- JS plugins: https://oxc.rs/docs/guide/usage/linter/js-plugins.html
- Oxfmt: https://oxc.rs/docs/guide/usage/formatter.html
- typescript-eslint supported versions: https://typescript-eslint.io/users/dependency-versions
- Revisit if the JS plugin layer breaks the Tailwind rules, or if a rule we need exists only in ESLint and typescript-eslint supports TypeScript 7.
