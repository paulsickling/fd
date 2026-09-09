---
title: 'Property search with URL-reflected filters'
type: 'feature'
created: '2026-09-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A search on this site has to filter by the water as readily as by the house,
and a search a buyer builds is a thing they send to a partner or an agent — so it has to
survive being copied out of the address bar.

**Approach:** A filter panel ordered the way this buyer narrows down, with all filter state
held in the URL rather than component state (SPEC.md CAP-2).

</frozen-after-approval>

## Implementation Notes

**Decisions**

- Filter state lives entirely in the URL via `useSearchParams`. There is no local mirror,
  so the URL cannot drift from the results.
- Extracted `src/domain/criteriaUrl.ts` as the single wire format for criteria. Three
  things now share it: the browser URL, `RemoteDataRepository` (which sends criteria to a
  server), and the fake backend the contract suite drives. A second spelling anywhere would
  have been a silent divergence, and this removed the duplicate that already existed.
- The URL is user-editable, so every value is validated on the way in. Unknown enum members
  and non-numeric numbers are dropped rather than propagated into the filters.
- Filters use `replace` rather than `push`, so adjusting a price does not bury the back
  button under a stack of intermediate searches.
- Panel order is destination → budget → the surf → the property → ownership. A conventional
  portal leads with bedrooms; here the surf outranks it, which is the premise.
- The empty state explains itself rather than showing a blank grid, and suggests the
  loosening that usually helps.

**Bug found and fixed:** `Number('')` is `0`, so a bare `maxPriceUsd=` in the URL parsed as
a real filter of zero and silently returned nothing. Caught by a test written before the
implementation was finished; the parser now rejects empty and whitespace-only values.

**Verification:** 135 tests pass, 9 of them for this page — including restoring a search
from a URL alone, combining a property filter with a surf filter, and shrugging off a
hand-edited junk parameter. Lint, typecheck and build clean.
