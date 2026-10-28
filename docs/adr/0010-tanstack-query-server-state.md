---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0010. TanStack Query for server state

## Context and problem statement

There is no backend yet, but projects built on this boilerplate will read external APIs and, later, `apps/api` (ADR-0002). Client components need caching, deduplication and revalidation of server data without hand-written effects. The project owner mandated TanStack Query. How is it wired into Next.js 16 with Server Components and Cache Components (ADR-0004)?

## Decision drivers

- No data shared between requests or users on the server.
- Data prefetched on the server is reused on the client without a second request.
- No refetch right after hydration.
- Developer tooling without production cost.

## Considered options

- TanStack Query with server prefetch and hydration
- SWR
- Server Components and Server Actions only, no client cache

## Decision outcome

Chosen option: "TanStack Query with server prefetch and hydration". Mandated by the project owner; the integration follows the TanStack Query advanced server-rendering guide.

- `getQueryClient()` creates a new `QueryClient` per request on the server and reuses a singleton in the browser, selected with `isServer` from `@tanstack/react-query`.
- Server Components prefetch with `queryClient.prefetchQuery(...)` and pass the result through `<HydrationBoundary state={dehydrate(queryClient)}>`; client components read it with `useQuery` or `useSuspenseQuery`.
- The default `staleTime` is greater than 0, so data hydrated from the server is not refetched immediately on mount.
- `ReactQueryDevtools` is included in development only.
- The provider is a leaf `"use client"` component in `apps/web` (ADR-0004).
- Each data source has one caching owner: Next.js `use cache` for data only rendered on the server, TanStack Query for data that client components refetch or mutate.

SWR and server-only data fetching were not evaluated in depth because the library is mandated.

### Consequences

- Good, because server-prefetched data hydrates into the client cache without a second request.
- Good, because a per-request client prevents data leaking between users.
- Good, because future backends plug in as query functions without changing the provider.
- Bad, because the provider and the Query runtime ship to the client before any query exists (YAGNI trade-off accepted under the owner's mandate).
- Bad, because two caching layers (Next.js and TanStack Query) coexist; a source cached in both can serve inconsistent data.

## More information

- Advanced server rendering: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- Devtools: https://tanstack.com/query/latest/docs/framework/react/devtools
- Revisit when `apps/api` is created (typed client, query key conventions), or if no project uses client-side server state.
