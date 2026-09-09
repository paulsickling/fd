# Salt &amp; Longitude

A proof of concept for a surf-destination-led international property platform, aimed at
expats and second-home buyers in Bali, Ko Samui and the Mentawai Islands.

The premise: this buyer chooses an **island and a season** before they choose a house.
Every property portal inverts that by opening on a postcode search. Here, destination is
the entry point, surf intelligence is structured data rather than a sentence in a blurb,
and foreign-ownership rules are on the listing card instead of buried in a FAQ.

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

| Command | Purpose |
|---|---|
| `pnpm dev` | Development server with hot reload |
| `pnpm test` | Full test suite (Vitest + React Testing Library) |
| `pnpm lint` | ESLint, including the data-layer guardrail below |
| `pnpm typecheck` | TypeScript, `strict` plus `exactOptionalPropertyTypes` |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Serve the production build |

No Docker, no backend, no deployment required — everything runs locally.

## What it does

- **Destination-first discovery.** The landing surface is three destinations scored on
  season, ability, access and price. Property comes second, on purpose.
- **Search that leads with the water.** Filter by ability, break type, wave direction and
  travel time to the surf alongside price and bedrooms. All filter state lives in the URL,
  so a search is shareable and reproducible.
- **Surf breaks as first-class entities.** Fourteen real breaks with their own pages —
  type, direction, skill range, optimal swell/wind/tide, hazards, crowd and seasonality —
  linked bidirectionally to the properties near them.
- **The seasonality overlay.** Twelve months of surf, weather and crowd on one axis, with
  the sweet-spot months marked. Bali peaks April–October; Ko Samui peaks November–February.
  Owning in both is a year-round proposition, and the chart shows why.
- **Tenure transparency.** What a foreign buyer can actually own, per country, with the
  honest caveat — Indonesian *Hak Pakai* is tied to your visa status; Thai lease
  auto-renewal clauses are unenforceable; a Thai condo inside the 49% foreign quota is the
  one genuinely secure freehold route.
- **An opt-in surfer profile** that re-ranks destinations and properties against your
  ability, boards, crowd tolerance and travel months — and explains every score in words.

## Architecture

### The data layer is the point

The PoC ships with seeded JSON because there is no backend, but the requirement was that it
be replaceable by a real API later. That is not a promise here; it is a tested property.

```
components / features
        ↓  hooks only
TanStack Query hooks            src/data/queries.ts
        ↓  the interface, never a source
DataRepository                  src/data/DataRepository.ts
        ├── JsonDataRepository  reads bundled seed
        └── RemoteDataRepository a real REST client, injectable fetch
```

- **One contract suite runs against both adapters** (`src/data/DataRepository.contract.test.ts`).
  The remote adapter is driven against an in-process fake backend that parses the query
  string back into criteria and answers from identical data — so both paths are genuinely
  exercised, and a further test asserts the remote adapter really issued the request URLs
  rather than shortcutting the transport.
- **Swapping the source is one line** in `src/data/repositoryContext.ts`.
- **The boundary is enforced by lint, not discipline.** `eslint.config.js` forbids importing
  a `.json` file, importing a concrete adapter, or touching `fetch` anywhere outside
  `src/data/`. Violating it fails the build.
- **`src/domain/` is pure** — no React, no routing, no knowledge of where data comes from,
  also lint-enforced. Filtering, seasonality and match scoring are therefore unit tested
  without rendering anything.
- **`src/domain/criteriaUrl.ts` is the single wire format** for a search, shared by the
  browser URL, the REST adapter and the test backend. There is only one spelling of a
  query in the codebase.

### Layout

```
src/
  app/         routes, providers, composition
  domain/      types, filters, seasonality, matching, formatting — pure
  data/        the repository interface, adapters, query hooks, seed JSON
  features/    destinations, properties, breaks, search, profile, credits
  components/  shared presentational components
  test/        setup, the shared contract suite, the fake remote backend
```

## About the data

Surf data is **real**: break type, direction, skill range, optimal conditions, hazards and
seasonality for fourteen named breaks, researched from surf guides and cross-checked. The
seasonal inversion between Bali's west coast, Bali's east coast and the Gulf of Thailand is
reproduced faithfully and asserted by tests.

Market data is **real**; the listings are **not**. Prices, locations, land sizes, tenure
structures and the 20–40% sea-view premium are grounded in researched market bands, but the
24 listings are original compositions rather than real properties, and the photography is
licensed stock that does not depict them. Every photographer is credited on `/credits`.

Research sources are recorded in
`_bmad-output/planning-artifacts/research-notes.md`.

## Planning artifacts

This was built with the BMAD method. The full trail lives in `_bmad-output/`:

- `specs/spec-surf-led-expat-property-platform/SPEC.md` — nine capabilities, the contract
- `.../data-model.md`, `.../stack.md` — companions to the spec
- `.../stories.yaml` and `.../stories/` — the twelve stories and what each one decided
- `brainstorming/` — the session the direction came out of
- `planning-artifacts/research-notes.md` — the researched facts, with sources

## Known limitations

Deliberate non-goals for this PoC, all recorded in `SPEC.md`:

- No live surf forecast, cams or buoys. The static atlas is the whole surf layer; the
  forecast is the intended future extension, which is exactly the seam the data layer is
  built around.
- No accounts, no persistence beyond the browser, no transactions.
- The map is illustrative. Positions are seeded and unitless — no distance is ever computed
  from them, and travel times are stored edge data.
- Destination scoring covers surf and tenure only. Flights, cost of living, visas, schools
  and medical are real buyer concerns and are out of scope here.
