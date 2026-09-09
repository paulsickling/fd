---
title: 'Destination-first discovery surface'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every property portal opens on a postcode search, which is useless to a buyer
who has not chosen a country yet. This buyer picks an island and a season first.

**Approach:** Make the destination the entry point and the primary surface (SPEC.md CAP-1):
a landing page of destination cards carrying season, skill, access and guide price, and a
destination page leading with the island's surf and ownership rules before its listings.

</frozen-after-approval>

## Implementation Notes

- Landing page shows three destination cards. Season is computed as the destination's best
  break each month, so Bali correctly reads "Year-round" while each of its breaks has a
  sharp individual season.
- Destination page order is deliberate and matches the premise: hero, island summary, the
  breaks, when to be here (seasonality overlay), the lay of the land (stylised map), what a
  foreign buyer can own, then the property grid. Property comes last on purpose.
- Added `src/domain/format.ts` — pure display formatting for prices, surf vocabulary and
  the break headline. Prices abbreviate the way the market quotes them (USD 1.7M, IDR
  16.20bn, THB 38.0M).
- `PropertyCard` puts the surf headline and tenure label on the card itself, not behind a
  detail tab.
- Shipped the tenure panel here rather than deferring it: the risk note renders at the same
  weight as the label, which is the whole point of CAP-8.

**Bug found and fixed in existing domain code:** `describeMonthRange` collapsed a
non-contiguous month set to its first run only, so a sweet spot of Apr-Jun plus Sep-Oct
reported as "Apr-Jun" and silently dropped the shoulder months. Rewritten around a
`monthRuns` helper that reports every run and still joins December to January. Three
regression tests added.

**Verification:** 116 tests pass; lint, typecheck and build clean.
