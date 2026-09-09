# Brainstorm Intent — Surf-Led Expat Property Platform

**Date:** 2026-09-09 · **Mode:** Creative Partner · **Status:** Complete
**Source of record:** `.memlog.md` (same folder)

---

## Locked direction

**Property-centric.** We are selling property; that is the focus. Surf intelligence
is a *differentiating feature layer* that sells the property — it is not the product.
The visual language is aspirational high-end real estate, not Surfline's dark
utilitarian forecasting tool.

**Discovery is country/island-first.** The buyer chooses a destination — Bali, Ko Samui,
a private island — before they care about a street or a suburb. Search must reflect that
hierarchy rather than the postcode-first model every property portal uses.

**Audience is a given.** Affluent expats and second-home buyers targeting surf
destinations in Southeast Asia and beyond. Not to be re-litigated.

---

## The architectural insight (carry this into design)

Surfline is really two stacked products, and the seam between them is exactly the seam
this PoC needs:

| Layer | Content | Our treatment |
|---|---|---|
| **Spot Atlas** (static) | Break type, optimal swell direction & size, wind, tide, season, skill level, bottom, hazards, crowd | Researched once from real breaks, seeded as local JSON. Permanent. |
| **Forecast** (live) | Cams, buoys, 16-day outlook, condition ratings, tide clock | The pluggable API swap point. Stubbed behind an interface now, wired later. |

This turns the "fixed data now, external API later" constraint from a PoC compromise into
deliberate architecture: the **atlas is permanent, the forecast is pluggable**. The same
seam applies to property data — seeded JSON now, external API/GraphQL later, behind one
repository interface.

---

## Features carried forward

**Core (PoC must have)**

1. **Destination-first discovery** — destination pages (`/bali`, `/ko-samui`, …) as a real
   surface, with the property grid on them. Country/island is the primary axis.
2. **Property search** — filters that lead with destination, then price, then property
   attributes, then surf attributes.
3. **Property listing detail** — the aspirational hero-photography page, with a surf
   intelligence panel as its signature differentiator.
4. **Surf breaks as first-class entities** — their own data records and pages, linked
   bidirectionally with properties. A property lists its nearby breaks; a break lists
   nearby properties. The JSON becomes a graph, not a decoration.

**Differentiators (what makes this not a portal)**

5. **Paddle-out distance as a headline listing stat** — borrowed from ski real estate's
   "ski-in/ski-out". The card reads *"3 breaks within 15 min · dawn patrol on foot"*
   alongside, not beneath, bed/bath.
6. **12-month seasonality overlay** — swell season vs. dry season vs. crowd season on one
   strip. "The waves are best in July, but so is everyone else, and it rains in February."
   The single most demo-able graphic in the product.
7. **Surfer profile match score** — the user states ability, board preference and crowd
   tolerance once; destinations and properties are re-ranked against it. Makes a *static*
   dataset feel personalised and alive with zero backend.

**Deferred (noted, not in PoC scope)**

8. Destination scorecards beyond surf — flights, cost of living, visa friction, foreign
   ownership law, medical, schools. Real buyer concerns, but scope-heavy.
9. Live forecast integration — the deliberate extension point, not the demo.

---

## Constraints (from the brief)

- **React** frontend.
- **PoC**: property listings fixed/seeded — no backend container available to persist.
- **Must be extensible**: data access behind an interface so an external REST/GraphQL
  source can replace the JSON without touching the UI.
- **Surf spot data** researched from real breaks and held in local JSON.
- **Property seed data** modelled on real listings researched from the market — realistic
  prices, locations and attributes, without republishing scraped copy or photography.
- Runs locally. No Docker. No internet-facing deployment.

---

## Ready for

`bmad-spec` → `bmad-architecture` → `bmad-create-epics-and-stories` → `bmad-build`.
