# Domain

Pure TypeScript over the types in `data-model.md`: entity types, filter predicates,
seasonality logic and match scoring. No React, no routing, no knowledge of where data comes
from — all enforced by the `domainPurity` block in `eslint.config.js`.

Keeping this layer pure is what lets the highest-value logic (match scoring, seasonality)
be unit tested directly, without rendering anything.
