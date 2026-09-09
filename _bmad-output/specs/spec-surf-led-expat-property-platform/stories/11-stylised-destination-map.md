---
title: 'Stylised destination map'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Property buyers expect to see where things are, but real geospatial search is
an explicit non-goal and the seed carries no coordinates.

**Approach:** An illustrative per-destination map plotting breaks and properties from
seeded unitless positions, with markers linking through — visual payoff without implying
precision the data does not have (SPEC.md CAP-9).

</frozen-after-approval>

## Implementation Notes

Delegated to a subagent.

- Inline SVG only: no mapping library, no tile server, no lat/lng, and no distance is ever
  computed from `mapPoint`. Travel times remain seeded edge data.
- Breaks and properties use distinct marker shapes, each an accessible link to
  `/breaks/:id` or `/properties/:id`.
- Stylised land/water backdrop keeps it abstract, so it reads as illustrative rather than
  surveyed.
- `highlightPropertyId` emphasises one marker, ready for the property detail page in
  story 7.

**Verification:** 9 component tests; vitest, tsc and eslint all clean.
