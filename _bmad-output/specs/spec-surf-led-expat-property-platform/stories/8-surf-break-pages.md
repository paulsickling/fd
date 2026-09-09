---
title: 'Surf break pages and bidirectional navigation'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** If breaks are only an attribute of listings, the atlas is decoration. Making
them first-class entities with their own pages is what turns the seed into a graph.

**Approach:** A page per break carrying its atlas record, and the reverse edge — the
properties near it — so property → break → property works with no dead ends
(SPEC.md CAP-4).

</frozen-after-approval>

## Implementation Notes

Delegated to a subagent, working from DestinationPage as the style reference.

- Sections read as a surf atlas entry in property-editorial clothing: header with aliases
  (Lances Right / HT's / Hollow Trees), "What it wants" for optimal swell, wind and tide,
  and "What you are paddling into" for crowd and hazards — stated honestly, since an atlas
  that flatters the wave is useless.
- Named sections render when present, so Uluwatu shows its five and Lances Right shows The
  Office and The Main Peak.
- A small inline-SVG twelve-bar season strip with an accessible title and an sr-only
  month-by-month list. `SeasonalityOverlay` was deliberately not reused — that component
  takes a Destination and answers a different question.
- The reverse edge renders with the existing `PropertyCard`, each carrying its seeded
  travel caption.

**Verification:** 9 tests, including the property → break → property round trip that proves
CAP-4.
