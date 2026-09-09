# Stack & Conventions

Implementation prescription for the PoC. The kernel says *what*; this file says *how*.

---

## Toolchain

| Concern | Choice | Rationale |
|---|---|---|
| Build | Vite | Fast local dev; no SSR needed (explicit non-goal) |
| Language | TypeScript, `strict: true` | The data model is the product; types are the contract |
| UI | React 19 | Fixed by the client |
| Styling | Tailwind CSS | Speed to a premium look without hand-rolling a design system |
| Routing | React Router | URL-reflected filter state is a CAP-2 success criterion |
| Server state | TanStack Query | The seam that makes CAP-7 real — see below |
| Testing | Vitest + React Testing Library | Same transform pipeline as Vite; no separate config |
| Package manager | pnpm | Available on the machine |

No Docker. No deployment target. `pnpm dev` and `pnpm test` are the only entry points that
must work.

## The data layer seam (CAP-7)

The single most important structural rule, and the thing the client demo turns on.

```
UI components
    ↓ (hooks only — useProperties, useDestination, useBreak)
TanStack Query hooks
    ↓ (call the interface, never a source)
DataRepository  ← interface
    ├── JsonDataRepository      (ships now — reads bundled seed JSON)
    └── RemoteDataRepository    (stub now — proves the swap)
```

Rules:

1. **No component imports a `.json` file or calls `fetch`.** Enforced by an ESLint
   `no-restricted-imports` rule so the constraint fails the build rather than relying on
   discipline.
2. `DataRepository` is a plain TypeScript interface returning promises. Even the JSON
   adapter is async, so no call site has to change when it becomes a network call.
3. The active repository is chosen at **one** composition point (a provider at the app
   root). Swapping the implementation is a one-line change there.
4. Query keys are stable and domain-shaped (`['properties', filters]`,
   `['destination', id]`) so caching behaviour is identical across adapters.
5. **Contract tests** run the same suite against both adapters. This is what makes CAP-7
   demonstrable rather than asserted — the stub remote adapter passing the identical tests
   is the evidence.

Filtering, sorting, and match scoring live **behind** the repository, not in components.
Under JSON they run in memory; under a real API they become query parameters. Components
never learn which.

## Project structure

```
src/
  app/                  routes, providers, composition root
  domain/               types, match scoring, seasonality logic — pure, no React
  data/
    DataRepository.ts   the interface
    json/               JsonDataRepository + seed JSON
    remote/             RemoteDataRepository stub
  features/
    destinations/
    properties/
    breaks/
    profile/
  components/           shared presentational components
  test/                 setup, contract test suite, fixtures
```

`domain/` must stay free of React and of any data-source knowledge — it is pure functions
over the types in `data-model.md`, and therefore trivially unit-testable.

## Testing expectations

- **Domain logic** (match scoring, seasonality bands, filter predicates) — unit tested
  directly. Highest value per test here.
- **Repository contract** — one shared suite executed against every adapter.
- **Components** — React Testing Library on behaviour that carries a CAP success
  criterion: filters narrowing results, URL reflecting state, profile changing ranking,
  bidirectional break↔property navigation.
- No snapshot tests of markup. They will not survive the styling work and prove nothing
  about the criteria above.
- `pnpm test` must pass before any story is called done.

## Presentation conventions

Property-first, per the locked direction:

- Photography leads every surface. Large imagery, generous whitespace, restrained type.
- Light, warm, editorial palette — the opposite of a dark forecasting tool.
- Surf data is rendered as refined infographics *within* the property aesthetic, never as
  a dense instrument panel.
- The seasonality overlay (CAP-5) is the signature graphic and must survive to mobile
  width.
- Accessible by default: real semantic elements, keyboard-navigable filters, alt text on
  every image (`ImageRef.alt` exists for this), and colour never the sole carrier of
  meaning in the seasonality chart.

## Attribution

Every seeded image carries `credit` and `creditUrl` and renders that credit in the UI.
This is a hard requirement of the licensed-imagery constraint, not a nicety.
