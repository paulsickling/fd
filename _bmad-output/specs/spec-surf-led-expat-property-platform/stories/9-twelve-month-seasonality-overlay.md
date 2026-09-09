---
title: 'Twelve-month seasonality overlay'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** "The waves are best in July, but so is everyone else, and it rains in
February" is the insight this buyer needs, and it only exists in the overlap of three
signals that no portal shows together.

**Approach:** One inline-SVG graphic per destination overlaying surf consistency, weather
and crowd across twelve months, highlighting the months that are good on all three
(SPEC.md CAP-5).

</frozen-after-approval>

## Implementation Notes

Delegated to a subagent. Consumes the existing pure logic in `src/domain/seasonality.ts`
without modifying it.

- Inline SVG, no charting dependency. `viewBox="0 0 360 152"` chosen so that at the 360px
  mobile breakpoint one SVG unit is one CSS pixel and month labels render at a true 9px.
- Surf is the dominant bar; weather and crowd are slim tracks beneath, separated by
  **texture** (crowd is diagonally hatched) rather than hue alone.
- Sweet-spot months carry three non-colour signals — a marker dot, a column wash and a
  bolder label — plus data attributes so the distinction is assertable in tests rather than
  only visible.
- `role="img"` with a title summarising the season as a sentence, an sr-only list of all
  twelve months in words, and a visible caption stating the run and sweet spot in plain
  English.

The subagent flagged that `describeMonthRange` under-reported non-contiguous sweet spots;
that was a real bug in the domain layer and has been fixed rather than worked around.

**Verification:** 8 component tests; vitest, tsc and eslint all clean.
