---
title: 'Presentation, accessibility and mobile polish'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The capabilities were all built, but the surfaces around them were not: image
attribution was incomplete, there was no 404, no skip link, and nothing verified the
success-signal journey end to end.

**Approach:** Close the licensing obligation properly, finish the shell, and encode
SPEC.md's success signal as an executable test.

</frozen-after-approval>

## Implementation Notes

- **Attribution done properly.** A credit under every card thumbnail would wreck the grid
  and still be missed, so detail pages credit their images inline and `/credits` lists every
  photographer with what they shot. A test asserts the list is *complete* against the seed,
  not a sample — this is a licence obligation, not styling.
- Added a site footer, a real 404 route, a keyboard skip-to-content link, and an explicit
  statement that the listings are illustrative and not offers for sale.
- Wrote `README.md` for whoever picks this up next.
- Verified the production build serves every route (`/`, `/destinations/:id`, `/properties`,
  `/properties/:id`, `/breaks/:id`, `/credits`) with the seed bundled.

**Bug found and fixed — the important one.** The end-to-end test surfaced that the Canggu
and Pererenan listings each carried a single break edge pointing at **Uluwatu, 80 minutes'
drive**, because Canggu's own breaks were missing from the atlas. The detail page was
rendering "the surf from this door" above an 80-minute drive, and the match scorer zeroed
those two listings out. Fixed at the root by researching and adding the three real Canggu
breaks — Batu Bolong (beginner, forgiving), Berawa (intermediate daily driver) and Echo
Beach (heavy advanced left) — and re-pointing both listings at their actual local waves.
The Bali atlas is now nine breaks; seventeen in total.

Two new seed-integrity tests stop that class of bug returning: every listing must have a
break within 45 minutes, and every *locality* must be served by the atlas — the second one
names the gap rather than blaming the property.

**Also addressed from the verification report:** `BrowserRouter` shares one `window.history`
per test file in jsdom, so `App.test.tsx` and `SurferProfile.test.tsx` now reset it in
`beforeEach`; they were safe only because they never navigated. Two brittle hard-coded
counts were replaced with values derived from the seed — they broke the moment the atlas
grew, which is precisely what a magic number in a test does.

**Verification:** 187 tests pass across 17 files; lint, typecheck and build clean.
