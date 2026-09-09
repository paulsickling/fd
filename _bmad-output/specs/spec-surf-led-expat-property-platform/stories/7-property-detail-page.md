---
title: 'Property detail page with surf intelligence panel'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** This is the screen a client judges the product by. It has to read as premium
real estate while carrying the surf intelligence that makes the product different.

**Approach:** A hero-led listing page with the nearby-break panel and the paddle-out
headline stat, every surf fact derived from the atlas rather than authored per listing
(SPEC.md CAP-3).

</frozen-after-approval>

## Implementation Notes

Delegated to a subagent, working from DestinationPage as the style reference.

- Hero image plus a secondary gallery; every image is a figure carrying its own
  photographer credit, which the licence requires.
- Surf panel joins the seeded travel edge to the break's atlas record, so nothing about a
  wave is written on the listing — only how long it takes to get there. Rows sort
  closest-first and each links to its break page.
- The "dawn patrol on foot" badge uses the same walk-and-under-15-minutes threshold as
  `formatBreakHeadline` and `isWalkToBreak`, so the card and the page cannot disagree.
- Renders `DestinationMap` with `highlightPropertyId`, placing the listing among its
  neighbours.
- Tenure resolves against the country regime, showing term, plain-English meaning and risk
  note as body copy rather than small print.

**Verification:** 11 tests, including asserting surf facts against `bundledSeed` so Bingin
and Padang Padang genuinely read differently, and that a Thai listing shows no Indonesian
tenure leakage.
