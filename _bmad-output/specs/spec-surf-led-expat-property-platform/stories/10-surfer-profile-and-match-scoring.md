---
title: 'Surfer profile, match scoring and location-free ranking'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A seeded dataset that shows everyone the same thing feels static. The buyer's
own surfing is the signal that makes a destination right or wrong for them, and the product
knows enough to use it.

**Approach:** An opt-in surfer profile that re-ranks destinations and properties against a
transparent weighted heuristic, with a plain-English reason on every result
(SPEC.md CAP-6, and the location-free half of CAP-2).

</frozen-after-approval>

## Implementation Notes

**Decisions**

- The profile is a control, never a gate. With none set, every screen renders exactly as
  before and no match scores appear. Confirmed by a test.
- Scoring lives in `src/domain/matching.ts` — pure, unit-tested without rendering. Every
  signal emits a human-readable reason and `MatchBadge` always shows the reason beside the
  number, because a bare score cannot answer "why?".
- Ability is weighted above season deliberately: an expert is not sent to a beginner beach
  break just because it is in season. There is a test asserting exactly that, because the
  behaviour looks wrong until you see the reasoning.
- Being under-gunned is penalised harder than being over-gunned — a beginner at Padang
  Padang is in danger, an expert at Chaweng is merely bored.
- Ranking uses the single best reachable break rather than an average: one great wave
  nearby beats three mediocre ones, which is how surfers actually judge a location.
- Ties break on id so results never shuffle between renders.
- `localStorage` is wrapped in try/catch on both read and write, and stored blobs are
  validated rather than trusted — a profile from an older deployment must not crash today's
  app.
- The month selector carries the label "This is the signal that separates Bali from Ko
  Samui", which is the whole seasonal argument in one line.

**Verification:** 176 tests pass. The load-bearing one asserts that a beginner and an expert
receive materially different orderings of the identical seed; others cover opt-in
behaviour, persistence across a remount, clearing, and rejection of a corrupt stored
profile. Lint, typecheck and build clean.
