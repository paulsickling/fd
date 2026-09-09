---
id: SPEC-surf-led-expat-property-platform
companions:
  - data-model.md
  - stack.md
  - ../../planning-artifacts/research-notes.md
sources:
  - ../../brainstorming/brainstorm-surf-led-expat-property-platform-2026-09-09/brainstorm-intent.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Surf-Led Expat Property Platform (PoC)

## Why

An opportunity to capture. Affluent expats and second-home buyers targeting surf
destinations choose a **country or island first** — Bali, Ko Samui, a remote island chain —
and only then a property. Every property portal inverts this, forcing a postcode-first
search on a buyer who does not yet have a postcode in mind, and treating the surf that
drove the entire decision as an unstructured sentence in the listing blurb. This PoC
proves a property site organised the way this buyer actually decides: destination-led
discovery, with structured surf intelligence and country-specific ownership rules as the
attributes that sell the property. It is a client-facing demonstration, so it must look
and read like a premium property product, not a data tool.

## Capabilities

- **CAP-1** — Destination-first discovery
  - **intent:** A buyer can browse and compare destinations as the primary entry point, and reach that destination's properties from within it.
  - **success:** Landing on the app leads to a destination surface before any property; each destination page renders its own surf profile, tenure regime, and property grid. Cross-destination comparison is served by ranked search results (CAP-2) and the seasonality overlay (CAP-5), not by a dedicated compare screen.

- **CAP-2** — Search, including location-free surf-first search
  - **intent:** A buyer can filter properties by destination, price, and property attributes, and can also run a query containing no location at all — stating ability, break type, season, and budget — and receive ranked destinations.
  - **success:** Filtering by any combination of destination, price band, bedrooms, property type, tenure, and surf attributes narrows the result set correctly and is reflected in the URL. A query with no destination selected returns destinations ranked by fit, each showing why it ranked, with properties reachable from there.

- **CAP-3** — Property listing detail
  - **intent:** A buyer can open a property and see it presented as premium real estate, with its surf context attached rather than described.
  - **success:** The detail page leads with hero photography and headline price/tenure, and carries a surf intelligence panel listing every nearby break with distance, type, direction, and skill level. Every fact in the panel is derived from the surf atlas, not authored per listing.

- **CAP-4** — Surf breaks as first-class entities
  - **intent:** A break is a real record with its own page, linked bidirectionally to the properties near it, so the dataset is a graph rather than a per-listing decoration.
  - **success:** Each break has a page showing type, direction, skill level, optimal swell/wind/tide, seasonality, hazards, and crowd factor. That page lists properties near it; each of those properties lists the break. Navigating property → break → property works without dead ends.

- **CAP-5** — Twelve-month seasonality overlay
  - **intent:** A buyer can see, in one graphic, when a destination's surf is working against when its weather and crowds are good, so they can judge when they would actually be there.
  - **success:** A single 12-month chart per destination overlays swell consistency, weather, and crowd. Comparing Bali against Ko Samui visibly shows the inverted seasons. The chart reads correctly at mobile width.

- **CAP-6** — Surfer profile match score
  - **intent:** A buyer can state their ability, board preference, and crowd tolerance once, and have destinations and properties re-ranked against that profile.
  - **success:** Setting a profile changes the ranking and displays a per-item match score with a plain-English reason. A beginner longboarder and an advanced surfer receive materially different orderings of the identical dataset. The profile survives page reload. It is an optional control reachable from the header and search panel — never a gate: every screen is fully usable with no profile set.

- **CAP-9** — Stylised destination map
  - **intent:** A buyer can see where a destination's breaks sit relative to its properties, without the product claiming geospatial precision it does not have.
  - **success:** Each destination page renders an illustrative map plotting its breaks and properties from seeded relative coordinates. Markers link through to the corresponding break and property pages. No mapping library, no tile server, and no distance is computed from coordinates — travel times remain seeded edge data.

- **CAP-7** — Pluggable data layer
  - **intent:** All data reaches the UI through a repository interface, so the seeded JSON source can be replaced by a remote REST or GraphQL source without changing UI code.
  - **success:** No component imports a JSON file or fetch call directly. A second adapter implementing the same interface can be substituted at one composition point, demonstrated by the test suite running the same repository contract tests against the JSON adapter and a stub remote adapter.

- **CAP-8** — Tenure transparency
  - **intent:** A buyer can see and filter on how they would actually own each property, given that foreign ownership rules differ fundamentally by country.
  - **success:** Every listing carries a structured tenure type shown on both card and detail, with a plain-English note on what it means and its risk. Tenure is a working filter. Indonesian and Thai properties surface their genuinely different regimes rather than a shared generic label.

## Constraints

- Frontend is React 19 + TypeScript on Vite, styled with Tailwind, routed with React Router, with server-state through TanStack Query. Tests are Vitest + React Testing Library. See `stack.md`.
- No backend and no persistence layer are available. All domain data ships as static JSON bundled with the app; any user state is client-side only.
- No component may import JSON or issue a fetch directly. All reads go through the repository interface — this is what makes CAP-7 demonstrable rather than claimed.
- Runs locally only. No Docker, no internet-facing deployment.
- Exactly three destinations are seeded: Bali, Ko Samui, Mentawai Islands.
- Seed data is researched-realistic: prices, locations, sizes, and attributes are grounded in the real market per `research-notes.md`; listing copy is original; imagery comes from properly-licensed free sources. Verbatim scraped listing copy and hotlinked portal images are prohibited.
- Surf atlas content is restricted to the **static** layer (break type, direction, skill, optimal conditions, seasonality, hazards, crowd). Live-forecast content is out of scope but the interface must not preclude it.
- Presentation is property-first: aspirational photography-led, not a dark data-tool aesthetic. Surf data is styled to sell the property.

## Non-goals

- Live surf forecasts, cams, buoy readings, or tide clocks. The atlas is static; the forecast layer is the deliberate future extension point.
- User accounts, authentication, or any server-side persistence. Saved state is local only.
- Any transactional flow: offers, payments, bookings, mortgage or finance calculators, agent messaging.
- An admin or CMS surface for creating or editing listings. Data is seeded, not authored in-app.
- Full destination scorecards beyond surf and tenure — flights, cost of living, visa process, schools, and medical are recognised buyer concerns but are out of scope for this PoC.
- Server-side rendering, SEO optimisation, and internationalisation or live currency conversion.
- Real-time or distance-accurate mapping, tile servers, and mapping libraries. The CAP-9 map is illustrative and seeded; break proximity is a stored attribute, never a computed geospatial query.
- A dedicated side-by-side destination comparison screen. Ranked results and the seasonality overlay carry that job.
- Onboarding, wizards, or any gate before a buyer reaches property. The surfer profile is opt-in.

## Success signal

A client demonstration in which someone states only "intermediate surfer, left-hand reef,
want it working in July, budget under USD 1.5M", receives Bali ranked above Ko Samui with
the reason shown, opens a Bingin property, sees its nearby breaks and the seasonality
overlay explaining why July is right, and understands from the tenure note what they would
actually be buying — and in which a developer can then point at a single file and show how
the same screens would be fed by a GraphQL endpoint instead.

## Assumptions

- Property counts of roughly 8 listings per destination (~24 total) and roughly 5 breaks per destination (~15 total) are sufficient to make search, ranking, and comparison feel real. Not confirmed with the user.
- "Private islands" in the original brief is interpreted as remote, boat-access island destinations, satisfied by the Mentawai Islands, rather than whole-island freehold sales.
- Prices are displayed in USD with the local-currency figure shown alongside, since the researched market data is quoted in IDR and THB.
- Match scoring is a transparent weighted heuristic over seeded attributes, not a learned model.
