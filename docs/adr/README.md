# Architecture Decision Records

Every technical decision in this repository (technologies, skills, MCP servers, tooling, patterns, configuration) is recorded as an ADR; design choices live in `DESIGN.md`. ADRs use the [MADR 4](https://adr.github.io/madr/) format ([ADR-0001](0001-record-architecture-decisions.md)). Agents propose a decision by copying [`template.md`](template.md) to `NNNN-kebab-title.md` with `status: proposed` and adding it to the index below; the status lives only in each record's front matter. Only a human changes it to `accepted` or `rejected`. Accepted ADRs are immutable: to change a decision, write a new ADR that supersedes the old one, whose status then becomes `superseded`. CI runs `pnpm adr:check` and fails while any ADR is `proposed` or malformed, and a Claude Code `PreToolUse` hook (`tooling/src/hooks/guard-adr-status.ts`) blocks agents from writing `status: accepted` or `status: rejected`.

| #    | Title                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| 0001 | [Record architecture decisions with mandatory human approval](0001-record-architecture-decisions.md)       |
| 0002 | [Turborepo monorepo with pnpm workspaces](0002-turborepo-monorepo-with-pnpm-workspaces.md)                 |
| 0003 | [pnpm 12 with strict catalogs](0003-pnpm-12-with-strict-catalogs.md)                                       |
| 0004 | [Next.js 16 App Router configuration](0004-nextjs-16-app-router.md)                                        |
| 0005 | [TypeScript 7 with the strictest compiler options](0005-typescript-7-strictest-options.md)                 |
| 0006 | [Oxlint and Oxfmt for linting and formatting](0006-oxlint-and-oxfmt.md)                                    |
| 0007 | [Tailwind CSS v4 with a locked theme](0007-tailwind-v4-locked-theme.md)                                    |
| 0008 | [Design tokens live in code](0008-design-tokens-in-code.md)                                                |
| 0009 | [Design-system component architecture](0009-component-architecture.md)                                     |
| 0010 | [TanStack Query for server state](0010-tanstack-query-server-state.md)                                     |
| 0011 | [Motion stack: GSAP, Lenis and CSS](0011-motion-stack-gsap-lenis.md)                                       |
| 0012 | [Testing strategy and TDD](0012-testing-strategy-and-tdd.md)                                               |
| 0013 | [Figma integration from code to Figma](0013-figma-integration-code-to-figma.md)                            |
| 0014 | [Agent-first repository setup](0014-agent-first-repository-setup.md)                                       |
| 0015 | [Git conventions and local gates](0015-git-conventions-and-local-gates.md)                                 |
| 0016 | [CI quality gates and hygiene](0016-ci-quality-gates.md)                                                   |
| 0017 | [Conductor workspace configuration in the repository](0017-conductor-workspace-configuration.md)           |
| 0018 | [Inspiration, visual assets and 3D through skills and the Magnific MCP](0018-inspiration-assets-and-3d.md) |
| 0019 | [3D stage in the design system with three.js and React Three Fiber](0019-3d-stage-in-the-design-system.md) |
| 0020 | [Runtime token presets and unit tests in the web app](0020-runtime-token-presets-and-repository-facts.md)  |
| 0021 | [Technology and brand logos from Simple Icons](0021-brand-logos-from-simple-icons.md)                      |
| 0022 | [Media component and image pipeline](0022-media-component-and-image-pipeline.md)                           |
| 0023 | [Static export to GitHub Pages](0023-static-export-to-github-pages.md)                                     |
