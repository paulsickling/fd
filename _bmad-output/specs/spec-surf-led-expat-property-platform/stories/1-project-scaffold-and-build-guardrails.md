---
title: 'Project scaffold and build guardrails'
type: 'chore'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-surf-led-expat-property-platform/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-surf-led-expat-property-platform/stack.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository is empty. Story 1 of the surf-led expat property PoC needs a
working React toolchain before any capability can be built, and the PoC's central
architectural claim (CAP-7: the JSON data source is swappable for a real API) depends on a
build-time guardrail that stops components reaching data sources directly. Without that
rule established at scaffold time, the constraint degrades into convention and the claim
stops being demonstrable.

**Approach:** Scaffold a Vite + React 19 + TypeScript (strict) application with Tailwind,
React Router and TanStack Query, tested by Vitest and React Testing Library, using pnpm.
Create the `src/` structure defined in `stack.md` — `app/`, `domain/`, `data/`,
`features/`, `components/`, `test/` — and add an ESLint `no-restricted-imports` rule
forbidding `.json` imports and direct `fetch` from anywhere outside `src/data/`, so
violating CAP-7's constraint fails lint rather than passing silently. Ship one placeholder
route and one passing test to prove the pipeline end to end.

</frozen-after-approval>

## Implementation Notes

**Decisions made**

- Scaffolded by hand rather than via `pnpm create vite`, so every config file is
  deliberate and the guardrail is present from the first commit rather than bolted on.
- Tailwind v4 with `@tailwindcss/vite` and CSS-first `@theme` config — no
  `tailwind.config.js`. The palette is defined as sand/ink/ocean tokens in `src/index.css`
  to establish the light, warm, editorial direction `stack.md` calls for.
- The guardrail is two ESLint blocks, not one. `dataLayerGuardrail` stops any code outside
  `src/data/` importing `.json`, importing a concrete adapter, or touching `fetch`.
  `domainPurity` additionally stops `src/domain/` importing React, routing or query code,
  which is what keeps that layer unit-testable without rendering.
- `src/app/providers.tsx` is written as the single composition root, with a comment marking
  where story 2 selects the `DataRepository`. Query defaults are `staleTime: Infinity`,
  `retry: false` — correct for seeded data and easily relaxed for a real API.
- Route shape encodes the product premise: `/destinations/:id` before `/properties/:id`.
  Only `/` is implemented; the rest are documented in `routes.tsx` against their stories.
- Added `README.md` to `src/data/` and `src/domain/` explaining why each boundary exists,
  so the next agent to open those folders reads the reason before the rule.

**Surprises**

- pnpm 12 no longer reads `pnpm.onlyBuiltDependencies` from `package.json`, and the
  pnpm 10 `onlyBuiltDependencies:` key in `pnpm-workspace.yaml` is also ignored. The
  current setting is an `allowBuilds:` map. Resolved with `pnpm approve-builds esbuild
  --yes`, which wrote the correct form; `pnpm-workspace.yaml` now carries
  `allowBuilds: { esbuild: true }` so a fresh clone installs without an interactive prompt.
- Vitest 2.x pulls its own Vite 5 types, which collide with Vite 6 and break `tsc -b` on
  `vite.config.ts`. Upgraded to Vitest 3.2.7.
- `import.meta.url` in `vite.config.ts` needed `@types/node` plus `types: ["node"]` in
  `tsconfig.node.json`; CSS imports needed `vite/client` in `tsconfig.app.json`.

**Verification**

- `pnpm typecheck`, `pnpm lint`, `pnpm test` (1 passing), `pnpm build` (89 modules) and
  `pnpm dev` (HTTP 200 on the served page) all confirmed green.
- The guardrail was proved rather than assumed: a temporary probe file importing seed JSON,
  importing a concrete adapter, calling `fetch`, and importing React into `src/domain/`
  produced 5 lint errors across all four restricted patterns. The probe was then deleted
  and `pnpm lint` returned clean.

**Files added**

`package.json`, `pnpm-workspace.yaml`, `.gitignore`, `index.html`, `vite.config.ts`,
`eslint.config.js`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`,
`src/main.tsx`, `src/index.css`, `src/app/{App,App.test,providers,routes,HomePlaceholder}.tsx`,
`src/test/setup.ts`, `src/data/README.md`, `src/domain/README.md`.
