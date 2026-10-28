---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0005. TypeScript 7 with the strictest compiler options

## Context and problem statement

Agents write most of the code, so the type checker is the first net for their mistakes. TypeScript 7 (the native compiler) is released, but its JavaScript compiler API is not available yet, which breaks tools that load TypeScript as a library. Next.js 16.4 type-checks by running the project-local `tsc` CLI (`experimental.useTypeScriptCli`, on by default), which is what makes TypeScript 7 usable in the app. Which TypeScript version and options do we use?

## Decision drivers

- Catch as many errors as possible at compile time.
- Fast type-checking, since it runs often.
- One shared configuration for every workspace.
- Repository scripts run as `node script.ts` on Node 24, without a build step or loader.
- Compatible with Next.js 16.4 and with type-aware linting (ADR-0006).

## Considered options

- TypeScript 7.0.2 with the strictest options
- TypeScript 6.0 with the same options
- TypeScript 7 with `strict` only

## Decision outcome

Chosen option: "TypeScript 7.0.2 with the strictest options". TypeScript 6.0 would only be needed to keep typescript-eslint, which ADR-0006 replaces. `strict` alone leaves unchecked index access and optional-property ambiguity in place.

Presets in `@repo/typescript-config`: `base.json` (all workspaces), `react-library.json` (adds DOM libraries and `jsx: react-jsx`, used by `packages/ui`), `nextjs.json` (adds the `next` plugin and incremental builds, used by `apps/web`).

Options in `base.json` beyond `strict`:

| Option                                                    | Effect                                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `exactOptionalPropertyTypes`                              | `prop?: T` does not accept an explicit `undefined`                                |
| `noUncheckedIndexedAccess`                                | Indexed reads are typed `T \| undefined`                                          |
| `noImplicitOverride`                                      | Overrides are marked explicitly                                                   |
| `noImplicitReturns`, `noFallthroughCasesInSwitch`         | Every path returns; no accidental fallthrough                                     |
| `noPropertyAccessFromIndexSignature`                      | Dynamic keys use bracket access, so they stay visible                             |
| `noUnusedLocals`, `noUnusedParameters`                    | No dead variables or parameters                                                   |
| `verbatimModuleSyntax`                                    | Type-only imports are written as such and erased predictably                      |
| `erasableSyntaxOnly`                                      | No enums, namespaces or parameter properties, so Node 24 can strip types natively |
| `module: preserve`, `moduleResolution: bundler`, `noEmit` | Bundlers and Node produce output; `tsc` only checks                               |

### Consequences

- Good, because the native compiler makes frequent type-checks cheaper.
- Good, because classes of runtime bugs (unchecked index access, optional versus `undefined` confusion, missing returns) become compile errors.
- Good, because scripts such as `tooling/src/check-adrs.ts` and the Claude Code hooks run with `node` directly.
- Bad, because tools that need the TypeScript JavaScript API, including typescript-eslint, cannot use TypeScript 7 yet.
- Bad, because `exactOptionalPropertyTypes` causes friction with third-party types that pass `undefined` explicitly.
- Bad, because `erasableSyntaxOnly` rules out `enum`; union types and `as const` objects replace it.

## More information

- Announcing TypeScript 7.0: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- TSConfig reference: https://www.typescriptlang.org/tsconfig/
- Node.js TypeScript support: https://nodejs.org/api/typescript.html
- Next.js `useTypeScriptCli`: https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli
- Revisit when TypeScript 7 ships its JavaScript API, or when a required tool cannot run without it.
