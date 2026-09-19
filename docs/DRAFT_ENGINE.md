# Draft Engine

## Scoring factors (12, up from 8 in v1)

`counter`, `synergy`, `roleCompletion`, `laneCompatibility`, `teamfightSynergy`, `enemyThreatResponse`, `metaRelevance`, `flexibility`, `scaling`, `timing`, `executionFit`, `draftBalance`. Weights are plain config (`src/analytics/weights.config.ts`), editable live in Settings, always re-normalized to sum to 1.

Every factor returns a `confidence` tag (`curated | estimated | live | insufficient`) — the UI and AI layer both respect it; `insufficient` is rendered as "Insufficient data", never a guessed number.

## Win Condition Engine

`src/analytics/WinConditionEngine.ts` looks at a team's picked heroes' `scaling` curve + capability vector and returns a dominant phase (early/mid/late), a rough "shape" (teamfight / split-push / pick-off / grind), and a strength 0-100. With 0-1 heroes picked it explicitly returns `confidence: 'insufficient'` rather than asserting a phase.

## Threat tiers

`DraftAnalyzer.analyze()` sorts enemy threats by danger and labels the top one `primary`, the next two `secondary`, the rest `tertiary`.

## Recommendation types

`src/analytics/RecommendationClassifier.ts` assigns 0+ labels per candidate from real derived properties:
- `bestPick` — the single highest-scoring candidate.
- `alternative` — within 8 points of the best pick.
- `safePick` — zero risk factors and solid execution fit.
- `highCeiling` — 2+ risk factors, complexity ≥ 2, but still within 15 points of the best pick.
- `comfortPick` — only assigned when the player has an *enabled* profile listing this hero as a comfort pick.

## Player Fit (separate from objective score)

`computePlayerFit()` returns 0-100 from the player's own stated comfort/avoid heroes, preferred positions, and experience level. It is exposed as `PickCandidate.playerFit` and is never blended into `overallScore` — the UI shows it side-by-side, never merged.

## What-If

`DraftAnalyzer.whatIf(heroId, draft, opts)` simulates picking a hero into the next open ally slot and returns `{ before, after }` full `DraftAnalysis` objects, so the UI can show a concrete before/after/difference rather than a single opaque number. Surfaced today as a draft-composition-score delta in Pick Explorer (`computeDraftScore` before vs. after).

## Golden Draft test coverage

`src/analytics/__tests__/GoldenDraftScenarios.test.ts` — empty draft, partial draft, complete 5v5, unknown hero id, strong late-game enemy, strong early-game enemy, no-initiation ally draft, physical-damage-only draft, high-mobility/split-push enemy, scaling (late-game) enemy vs. timing factor, overlapping ally roles, What-If before/after, What-If with unknown hero, recommendation-type consistency, threat-tier ordering. Combined with the pre-existing `DraftAnalyzer.test.ts` scenarios (one hero, duplicate hero, missing live stats), this covers the scenario categories called out in the product spec without inventing pass/fail criteria the engine doesn't actually guarantee.

## Deferred: full Draft Scenario Tree

Simulating pick → enemy response → our response → final evaluation as a real branching tree (rather than a single What-If step) was not built this round — it would need either real historical response-frequency data (which we don't have access to) or would otherwise have to present made-up branch probabilities, which conflicts directly with the "no fake data" constraint. The single-step What-If is the honest version of this idea given the data actually available.
