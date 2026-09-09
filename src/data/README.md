# Data layer

Everything under `src/data/` is the **only** part of the app permitted to know where data
comes from. The ESLint guardrail in `eslint.config.js` enforces that: outside this
directory, importing a `.json` file, calling `fetch`, or importing a concrete adapter is a
lint error.

Story 2 fills this in:

- `DataRepository.ts` — the interface every consumer depends on
- `json/` — `JsonDataRepository`, reading the bundled seed data
- `remote/` — `RemoteDataRepository`, the stub proving the swap

Both adapters must pass the same shared contract test suite. That shared suite is the
evidence for SPEC.md CAP-7; without it the swappability claim is only an assertion.
