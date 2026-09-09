---
title: 'Domain types and the swappable data layer'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-surf-led-expat-property-platform/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-surf-led-expat-property-platform/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The PoC's central claim to the client is that its seeded JSON can be replaced
by a real API or GraphQL layer without touching the UI (SPEC.md CAP-7). Stated as an
intention, that claim is worth nothing — plenty of prototypes assert it and cannot deliver
it. It has to be provable on demand.

**Approach:** Implement the domain types from `data-model.md`, a `DataRepository` interface,
a `JsonDataRepository` reading bundled seed, a `RemoteDataRepository` that is a genuine REST
client with injectable `fetch`, and one composition point that selects between them. Prove
the equivalence with a single contract test suite executed against both adapters, driving
the remote one against an in-process fake backend serving identical data.

</frozen-after-approval>

## Implementation Notes

**Decisions**

- One `DataRepository` interface for all entities rather than one per entity: a remote
  implementation maps each method to a single endpoint or GraphQL field.
- Filtering, sorting and the property/break join live in `src/domain/filters.ts` — pure,
  source-agnostic. The JSON adapter runs them in memory; the remote adapter serialises the
  same criteria object into query parameters. Callers cannot tell which.
- Every method is async even under JSON, so no call site changes shape when the source
  becomes a network call.
- `RemoteDataRepository` takes an injected `fetchFn`. This is what makes it testable today
  without a live server while remaining a real client — point `baseUrl` at a service and it
  works unchanged.
- The composition root is `src/data/repositoryContext.ts`. Swapping adapters is a one-line
  change to `defaultRepository`.
- Split `RepositoryProvider` into its own file so the context module exports no components,
  clearing a react-refresh lint warning rather than suppressing it.
- Surf filters are conjunctive **per break**: a query for a walkable right-hander must be
  satisfied by one break that is both, not by combining a walkable left with a distant
  right. Covered by a dedicated test.
- Added `src/domain/seasonality.ts` early (needed by stories 5 and 9): destination
  seasonality is the best break each month, plus overlay construction, sweet-spot detection
  and a complementarity score.

**Verification**

- 75 tests pass: 33 contract tests (the same suite against both adapters), 13 seed
  integrity, 15 filter, 13 seasonality, 1 app shell. `pnpm lint`, `pnpm typecheck` and
  `pnpm build` all clean.
- One extra test asserts the remote adapter actually issued the expected request URLs with
  serialised criteria — without it the adapter could satisfy the contract by shortcutting
  the transport entirely.
- `seasonalComplementarity(bali, koSamui)` scores above 0.9, putting a number behind the
  product's year-round claim.
