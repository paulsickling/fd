# Data Model

Entity schemas for the seeded JSON atlas. All types are TypeScript-shaped; every field is
seeded, none computed at runtime unless noted. Field values must be grounded in
`../../planning-artifacts/research-notes.md`.

---

## Destination

The primary discovery entity (CAP-1).

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Slug, e.g. `bali`, `ko-samui`, `mentawais` |
| `name` | `string` | Display name |
| `country` | `string` | |
| `countryCode` | `string` | ISO-3166 alpha-2, for flag and tenure regime lookup |
| `tagline` | `string` | One line of editorial |
| `summary` | `string` | 2–3 sentences |
| `heroImage` | `ImageRef` | |
| `access` | `'road' \| 'flight' \| 'boat-charter'` | Mentawais is `boat-charter` — this is the "remote island" signal |
| `surfSeason` | `SeasonBand` | Peak and shoulder months |
| `weatherSeason` | `SeasonBand` | Dry/wet bands |
| `crowdSeason` | `SeasonBand` | Drives the CAP-5 overlay |
| `skillRange` | `SkillLevel[]` | Which surfers this destination actually suits |
| `priceRange` | `{ minUsd, maxUsd }` | Derived from seeded properties, stored for fast filtering |
| `tenureRegimeId` | `string` | FK → `TenureRegime` |
| `breakIds` | `string[]` | FK → `SurfBreak` |
| `mapAspect` | `number` | Width/height ratio of the stylised map canvas (CAP-9) |

## SurfBreak

First-class entity (CAP-4). Static atlas layer only — no forecast fields.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | e.g. `uluwatu`, `lances-right` |
| `name` | `string` | |
| `aliases` | `string[]` | e.g. Lances Right → `["HT's", "Hollow Trees"]` |
| `destinationId` | `string` | FK → `Destination` |
| `type` | `'reef' \| 'point' \| 'beach' \| 'rivermouth'` | |
| `direction` | `'left' \| 'right' \| 'both'` | |
| `skill` | `SkillLevel` | Minimum realistic level |
| `skillCeiling` | `SkillLevel` | Some breaks span a range |
| `optimal` | `OptimalConditions` | See below |
| `seasonality` | `MonthScore[12]` | 0–10 consistency per calendar month |
| `bottom` | `string` | e.g. `shallow reef`, `volcanic rock`, `sand` |
| `hazards` | `string[]` | e.g. `shallow reef`, `strong current`, `crowds` |
| `crowdFactor` | `1..5` | |
| `paddleOutMinutes` | `number` | Feeds the CAP-3 headline stat |
| `sections` | `BreakSection[]?` | Uluwatu's five sections, HT's "The Office" — optional |
| `notes` | `string` | Short editorial |
| `mapPoint` | `MapPoint` | Stylised-map position (CAP-9), unitless 0–1 — never lat/lng |

### OptimalConditions

| Field | Type |
|---|---|
| `swellDirection` | `string` (e.g. `SW`) |
| `swellSizeFt` | `{ min, max }` |
| `windDirection` | `string` (e.g. `SE`) |
| `tide` | `'low' \| 'mid' \| 'high' \| 'mid-to-high' \| 'any'` |

## Property

The thing being sold. Property-first: presentation fields lead, surf fields support.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `title` | `string` | Original copy, never scraped |
| `destinationId` | `string` | FK → `Destination` |
| `locality` | `string` | e.g. `Bingin`, `Chaweng` — display only, not a search axis |
| `type` | `'villa' \| 'estate' \| 'condo' \| 'land'` | |
| `priceUsd` | `number` | |
| `priceLocal` | `{ amount, currency }` | IDR / THB, per research |
| `bedrooms` / `bathrooms` | `number` | |
| `landSqm` / `builtSqm` | `number` | |
| `tenure` | `TenureType` | FK-ish → `TenureRegime.types` (CAP-8) |
| `tenureYears` | `number?` | e.g. 30 for a registered lease |
| `features` | `string[]` | e.g. `ocean view`, `private pool` |
| `seaView` | `boolean` | Research shows a real 20–40% price premium — must be reflected in seeded pricing |
| `images` | `ImageRef[]` | Licensed sources only |
| `description` | `string` | Original copy |
| `nearbyBreaks` | `NearbyBreak[]` | Seeded, not computed |
| `mapPoint` | `MapPoint` | Stylised-map position (CAP-9), unitless 0–1 — never lat/lng |

### NearbyBreak

The property↔break edge (CAP-4), carrying edge data.

| Field | Type |
|---|---|
| `breakId` | `string` |
| `travelMinutes` | `number` |
| `travelMode` | `'walk' \| 'drive' \| 'boat'` |

`travelMode: 'walk'` with a low `travelMinutes` is what earns a listing the
"dawn patrol on foot" headline treatment.

## TenureRegime

Per-country ownership rules (CAP-8). Keyed by `countryCode` so a destination inherits its
country's regime rather than restating it.

| Field | Type | Notes |
|---|---|---|
| `countryCode` | `string` | |
| `country` | `string` | |
| `types` | `TenureTypeDef[]` | |

### TenureTypeDef

| Field | Type | Notes |
|---|---|---|
| `id` | `TenureType` | e.g. `hak-pakai`, `hak-sewa`, `pt-pma`, `th-leasehold-30`, `th-company`, `th-condo-foreign-quota` |
| `label` | `string` | Display name |
| `foreignerEligible` | `boolean` | |
| `typicalYears` | `number \| null` | `null` = perpetual |
| `plainEnglish` | `string` | What the buyer is actually getting |
| `riskNote` | `string` | The honest caveat — e.g. Hak Pakai being bound to visa status; Thai auto-renewal clauses being unenforceable |
| `securityRating` | `1..5` | Enables sorting/filtering by ownership security |

## SurferProfile

Client-side only, persisted to `localStorage` (CAP-6). Never leaves the browser.

| Field | Type |
|---|---|
| `ability` | `SkillLevel` |
| `boards` | `('shortboard' \| 'longboard' \| 'fish' \| 'gun' \| 'sup')[]` |
| `crowdTolerance` | `1..5` |
| `preferredDirection` | `'left' \| 'right' \| 'both' \| 'no-preference'` |
| `travelMonths` | `number[]?` | Months they could actually be there |

## Shared types

```ts
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
/** Stylised-map position (CAP-9): unitless 0–1 within the destination's map canvas.
 *  Deliberately NOT lat/lng — no distance may ever be computed from these. */
type MapPoint = { x: number; y: number };
type MonthScore  = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type SeasonBand  = { peakMonths: number[]; shoulderMonths: number[]; note: string };
type ImageRef    = { src: string; alt: string; credit: string; creditUrl: string };
```

## Match scoring (CAP-6)

A transparent weighted heuristic over seeded attributes — deliberately not a learned model,
so the demo can always explain a ranking. Inputs and their intent:

| Signal | Compares | Why |
|---|---|---|
| Ability fit | `profile.ability` vs `break.skill`..`skillCeiling` | An expert break scores badly for a beginner and vice versa |
| Direction fit | `profile.preferredDirection` vs `break.direction` | Regular/goofy foot preference is real |
| Crowd fit | `profile.crowdTolerance` vs `break.crowdFactor` | |
| Season fit | `profile.travelMonths` vs `break.seasonality` | The signal that separates Bali from Ko Samui |
| Access fit | `property.nearbyBreaks` travel time and mode | Rewards the "walk to the break" listing |

Each contributing signal must produce a human-readable reason string; the UI shows the
reason, not just the number.
