---
title: 'Seed the surf atlas and tenure regimes'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/research-notes.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The surf atlas and the country ownership rules are the two things that make
this an expat surf-property product rather than a generic portal, and both must be factually
right — a client who knows these markets will check.

**Approach:** Author `surf-breaks.json`, `destinations.json` and `tenure-regimes.json` from
the researched sources only, reproducing the real seasonal inversion between Bali's west
coast, Bali's east coast and Ko Samui.

</frozen-after-approval>

## Implementation Notes

Delegated to a subagent working from `research-notes.md` and `src/domain/types.ts`.

- 14 breaks (bali 6, ko-samui 2, mentawais 6), 3 destinations, 2 tenure regimes covering
  all six `TenureTypeId` values.
- Seasonality verified numerically: the five Bukit breaks peak Jun–Aug, Keramas inverts to
  the wet season, Chaweng and Lamai peak Nov–Feb, the Mentawais run Mar–Nov.
- Tenure `riskNote` text is specific rather than boilerplate — Hak Pakai being bound to
  immigration status, Thai auto-renewal clauses being unenforceable, the condo 49% quota
  being the one genuinely secure freehold route.
- Hero image URLs verified HTTP 200 and photographer attribution confirmed from the
  Unsplash photo pages rather than search listings.

**Reconciliation applied afterwards:** destination `priceRange` values were estimated before
the properties existed and did not match them. Corrected against the actual seed, and locked
by an assertion in `src/data/seedIntegrity.test.ts` so it cannot drift again.

**Flagged by the subagent:** Mentawai `windDirection` is "SE", inferred from the research's
statement that the Indonesian dry season runs on SE trades rather than stated directly for
those breaks.
