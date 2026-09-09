---
title: 'Seed the property listings'
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

**Problem:** The demo needs listings realistic enough to survive a client who knows the Bali
and Ko Samui markets, without republishing scraped copy or hotlinked portal photography.

**Approach:** Author 24 original listings grounded in the researched market bands, with
correct per-country tenure, real currency conversion, the genuine sea-view premium, and
licensed imagery with attribution.

</frozen-after-approval>

## Implementation Notes

Delegated to a subagent working from `research-notes.md` and `src/domain/types.ts`.

- 24 properties, 8 per destination. USD 110,000–5,500,000 across the set.
- `priceLocal` exact at IDR 16,200 and THB 36 to the dollar.
- Tenure is legally correct per country: Indonesian properties carry only `hak-pakai`,
  `hak-sewa` or `pt-pma`; Thai properties only the Thai structures, with
  `th-condo-foreign-quota` restricted to `type: condo`.
- The researched sea-view premium is reflected in same-locality, same-bedroom comparisons:
  Bingin 3-bed +37.5%, Chaweng 3-bed +37.9%, Sipura 4-bed +30.4%.
- 8 walk edges under 10 minutes across 7 properties, so the "dawn patrol on foot" treatment
  in story 7 has data to render. Mentawai edges are `boat` apart from one beachfront walk.
- 71 distinct Unsplash URLs, no reuse, every one verified HTTP 200 twice.

Listing copy is original throughout — no portal text was copied.
