# Architecture

Two-level design, unchanged since v1 and extended, not replaced, by v2:

- **Level 1 — Data & Analytics Engine** (`src/data/`, `src/analytics/`, `src/patch/`): pure, synchronous, deterministic. Turns curated hero data + the current draft into scores, issues, threats, win conditions. No network calls, no AI, no randomness. Fully unit-tested.
- **Level 2 — AI Explanation Layer** (`src/ai/`): takes Level 1's already-computed numbers and turns them into natural-language explanations. Never invents a number Level 1 didn't produce. Always degrades to a plain-text rendering of the Level 1 data when no provider is configured or a request fails.

UI (`src/features/`, `src/components/`) only ever calls into these two layers — it never talks to a provider or a data source directly.

## New in v2

- **`src/analytics/TimingScalingEngine.ts`** — scaling/timing/execution-fit/draft-balance factors, folded into `PickScorer` as four more transparent, independently-tagged `FactorScore`s (12 total now, was 8).
- **`src/analytics/WinConditionEngine.ts`** — derives each team's likely win condition (phase + shape) from already-curated hero data. Returns `confidence: 'insufficient'` rather than a guess when fewer than 2 heroes are picked.
- **`src/analytics/RecommendationClassifier.ts`** — labels each candidate (Best Pick / Alternative / Safe Pick / High Ceiling / Comfort Pick) from real, derived properties (rank, risk count, execution difficulty, the player's own comfort pool) — never a cosmetic label. Also computes the separate, non-overriding **Player Fit** score.
- **Threat tiers** — `DraftAnalyzer` now labels enemy threats `primary`/`secondary`/`tertiary` by rank.
- **What-If** — `DraftAnalyzer.whatIf(heroId, draft, opts)` returns a before/after `DraftAnalysis` pair for a candidate pick into an open ally slot; surfaced in Pick Explorer as a before/after/difference draft-score panel.
- **Draft History** — `src/data/historyStore.ts`, backed by a real local SQLite database on desktop (`tauri-plugin-sql`, see `src-tauri/src/lib.rs`'s `migrations()`), with a localStorage-array fallback in a plain browser/test context so the History page still works without Tauri. See `docs/DATA.md`.
- **Player Profile** — `src/types/player.ts`, stored in `AppSettings.playerProfile`. Purely local; never blended into the objective `overallScore` — only ever shown as a separate `playerFit` number.
- **Onboarding** — a single first-run welcome screen (`src/components/FirstRunModal.tsx`), not a multi-step registration flow. Persisted via `settings.onboarded`.
- **Feature flags** — `AppSettings.featureFlags` (overlay, aiExplanations, simulator, whatIf, playerProfile, experimental), for turning optional pieces off without a code change.

## Deliberately not built this round (see LIMITATIONS.md-equivalent note in README)

A genuinely separate always-on-top overlay *window*, a full multi-source data-provider priority/versioning/checksum pipeline, a signed auto-updater, and a Playwright E2E suite were scoped out of this pass — each needs infrastructure (a second webview window with real interaction testing, a second real statistics source, code-signing + update hosting, a display server wired for full E2E) that would have diluted focus on the core engine and its correctness. Nothing here was faked or stubbed with a "coming soon" button; these are simply not present yet, and the architecture (provider interfaces, `DataSource` abstraction, feature flags) does not block adding them later.
