# Research Notes — Surf & Property Market Data

**Date:** 2026-09-09
**Purpose:** Ground the PoC seed data in real, defensible facts. Feeds the surf-spot
JSON atlas and the property seed records.

---

## 1. Surf atlas — the three seeded destinations

### Bali (Indonesia)

Two opposing seasons driven by the monsoon, which is the key structural fact:

- **Dry season (Apr–Oct):** SE trade winds blow offshore on the Bukit Peninsula's
  west-facing breaks. Uluwatu, Padang Padang, Bingin, Impossibles, Balangan at their best.
  Jun–Aug delivers the most powerful swell of the year.
- **Wet season (Nov–Mar):** wind switches NW, turning the **east coast** and Nusa Dua on.
  Keramas rewards advanced surfers with the island's most powerful barrels.

| Break | Type | Direction | Skill | Optimal | Peak months |
|---|---|---|---|---|---|
| Uluwatu | Reef | Left | Advanced–Expert | SW swell, SE wind; 5 sections (The Peak, Racetrack, Temples, Outside Corner, The Bombie) activate at different tides/sizes | Apr–Oct, best Jun–Aug |
| Padang Padang | Reef | Left | Expert | Large SW swell, higher tides; needs a bigger swell than most Bukit breaks | Jun–Aug |
| Bingin | Reef | Left | Intermediate–Advanced | SE trades established, right tide; short barrelling peak, more forgiving on smaller swells | Mid dry season |
| Keramas | Reef (volcanic rock) | Right | Advanced | Mid tide; shallow volcanic rock | Wet season (Nov–Mar) |

### Mentawai Islands (Indonesia — boat/charter access)

- **Season:** dry season **Mar–Nov** is the prime window — favourable winds, consistently
  large swells.
- Access is by boat charter or surf camp, not road. This gives the "private island /
  remote" flavour to the destination set.
- Shallow, sharp reef throughout; booties and wetsuit tops common.

| Break | Type | Direction | Skill | Notes |
|---|---|---|---|---|
| Lances Right (HT's / Hollow Trees) | Reef | Right | Advanced–Expert | World-class barrels. "The Office" is the fast section; "The Main Peak" walls over the shallow reef nicknamed the surgeon's table |
| Macaronis | Reef | Left | Intermediate–Advanced | The most ripable wave in the chain; mechanical left-hander, workable for intermediates on smaller days. Gets crowded |
| Lances Left | Reef | Left | Intermediate–Advanced | Consistent, fun rippable walls with some hollow sections |
| Rifles | Reef | Right | Expert | Heavy, critical, fast |
| Greenbush | Reef | Left | Expert | Heavy barrel |
| Bankvaults | Reef | Right | Advanced–Expert | Critical reef break |

### Ko Samui (Thailand — Gulf of Thailand)

**The strategically important finding: Ko Samui's season is the inverse of Bali's.**

- **Season:** Nov–Apr, peaking **Nov–Feb** with the NE monsoon. NE winds blow offshore,
  producing clean waves. Wind swell is generated during the Oct–Dec wet season.
- **Scale:** modest — waves rarely exceed 1–1.5m. A beginner/intermediate and longboard
  destination, not a performance one.

| Break | Type | Direction | Skill | Notes |
|---|---|---|---|---|
| Chaweng Beach | Beach break | Left (predominantly) | Beginner–Intermediate | The island's primary spot. Southern and central ends best. Long left-hander at mid–high tide, ideal for longboarding and SUP |
| Lamai Beach | Beach break | Both | Beginner | Smaller, cleaner waves; good when the surf is small |

**Product consequence:** Bali (Apr–Oct) and Ko Samui (Nov–Apr) are seasonally
complementary. A buyer holding in both surfs year-round. This makes the 12-month
seasonality overlay a genuine decision tool rather than decoration, and gives the
cross-destination comparison feature a real reason to exist.

---

## 2. Property market — realistic price anchors

### Bali

- Overall market spans roughly **USD 155,000** (entry 1-bed leasehold) to **USD 579,000+**
  for multi-bedroom freehold estates, with the luxury tier well above that.
- **Uluwatu / Bingin:** off-plan 1-bed from ~IDR 1.07bn. A 3-bed on 96 m² land at Bingin
  Beach Side listed at IDR 14bn; a 3-bed on 233 m² land at IDR 28bn.
- **Canggu / Seminyak:** mid-range 2–3 bed villas IDR 1.5bn–3.5bn.
- Demand concentrates in the **Bukit Peninsula** (Uluwatu, Bingin, Pecatu) and the
  **Canggu–Pererenan** corridor. 2–3 bedroom villas are the largest market share.

### Ko Samui

- Range from **฿5M (~USD 140k)** for a compact pool villa to **฿200M+ (USD 5.5M+)** for a
  beachfront estate.
- Core luxury segment: 3-bed private pool villas at **฿15M–฿40M (~USD 420k–1.1M)**.
- Current luxury listings observed spanning **฿16.9M–฿135M**.
- **Sea view / beachfront commands a 20–40% premium** over comparable inland property —
  a useful, real rule to encode in seed pricing.
- Active areas: Plai Leam, Chaweng, Bang Por, Lamai.

---

## 3. Tenure — the expat deal-breaker attribute

This is the concern that distinguishes an expat-focused portal from a domestic one, and it
differs fundamentally by country. It must be a **first-class listing field**, surfaced on
the card, not buried.

### Indonesia

- **Hak Milik (freehold)** — constitutionally reserved for Indonesian citizens. Not
  available to foreigners under any individual structure.
- **Hak Pakai (right to use)** — available to foreigners, but **bound to immigration
  status by design**. A visa lapse is a property risk, not merely an inconvenience.
- **Hak Sewa (lease)** — simpler, typically **25–30 years** with extension options. Less
  formal legal protection than Hak Pakai. Common in the Bali villa market.
- **PT PMA company** — the route to effective freehold ownership for foreigners.

### Thailand

- **Land / villas:** freehold not available to foreigners. Standard structure is a
  registered **30-year leasehold** on the land while owning the building outright, or
  ownership through a Thai Limited Company.
- **Critical caveat:** the Thai Supreme Court has ruled **automatic renewal clauses are
  not legally enforceable**. A "30+30+30" arrangement is a contractual promise for terms
  two and three, not a statutory right.
- **Condominiums:** foreigners can own **freehold** within the building's **49% foreign
  quota** (of total floor area), receiving a chanote title deed in their own name —
  legally secure and transferable. This is the most secure route in either country.

**Product consequence:** a `tenure` field with a plain-English risk explainer per type.
Filtering by tenure is a high-value expat feature no general portal offers well.

---

## Sources

- [Padang Padang Surf Camp — Uluwatu area spots](https://www.balisurfingcamp.com/surf-spots/uluwatu-area)
- [Padang Padang Surf Camp — Keramas](https://www.balisurfingcamp.com/surf-spots/east-coast/keramas)
- [Padang Padang Surf Camp — Bali surf seasons guide](https://www.balisurfingcamp.com/blog/bali-surf-seasons-guide)
- [Propertia — Uluwatu surf guide: every break, season and skill level](https://propertia.com/uluwatu-surf-guide/)
- [Lush Palm — Surfing Bali](https://lushpalm.com/surfing-bali/)
- [World Surfaris — Mentawai Islands surf guide](https://worldsurfaris.com/stoked/mentawai-islands-surf-guide/)
- [Surf Indonesia — Mentawai Islands surf spots](https://www.surfindonesia.com/mentawai-islands-surf-spots/)
- [The Surf Atlas — Mentawai surf](https://thesurfatlas.com/surfing-indonesia/mentawai-surf/)
- [Wikipedia — Lance's Right](https://en.wikipedia.org/wiki/Lance%27s_Right)
- [Surf-Forecast — Ko Samui surf guide](https://www.surf-forecast.com/breaks/Ko-Samui)
- [Vialala — Surfing in Koh Samui](https://www.vialala.com/en/blog/surf-a-koh-samui)
- [Saltwater Dreaming — Koh Samui surf spots](https://www.saltwater-dreaming.com/surfing-thailand/koh-samui.htm)
- [Bali Home Immo — villas for sale, Uluwatu](https://bali-home-immo.com/villa-for-sale-uluwatu)
- [Bali Exception — Uluwatu villas for sale](https://baliexception.com/area/uluwatu/)
- [Thailand-Property — villas for sale, Ko Samui](https://www.thailand-property.com/villas-for-sale/surat-thani/ko-samui)
- [Conrad Properties — Koh Samui luxury villas](https://www.conradproperties.asia/koh-samui-luxury-villa-for-sale)
- [Kinnara.Asia — Leasehold vs freehold in Thailand and Indonesia](https://kinnara.asia/blog/leasehold-vs-freehold-thailand-indonesia)
- [Varsovia Estate — Thailand 49% foreign quota guide](https://varsoviaestate.com/en/blog/foreign-quota-49-percent-thailand-condominium-guide-2026-c2a31e)
- [SKHAI — Can foreigners own property in Thailand or Bali? 2026 comparison](https://skhai.com/insights/thailand-vs-bali-foreign-property-ownership/)
