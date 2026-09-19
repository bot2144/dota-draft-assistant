# Dota 2 Draft Assistant (Dota AI Companion)

**AI-powered draft intelligence.** A desktop companion app that watches your current Dota 2 draft and tells you not just *what* to pick, but *why* — grounded in a transparent, deterministic scoring engine, with an LLM layer only for turning that data into readable explanations.

It never invents statistics. If live win-rate data isn't available, it says **"Insufficient data"** instead of guessing.

See `docs/ARCHITECTURE.md`, `docs/DATA.md`, `docs/DRAFT_ENGINE.md`, and `docs/SECURITY.md` for the deeper technical writeups behind the summaries below.

---

## What it does

- **Live Draft** — enter your team and the enemy team (click-to-add, search, or paste a text list), and see ranked **Best Picks**, **Recommended Bans**, **Draft Issues** (missing roles, no initiation, illusion-vulnerable, etc.) and **Enemy Threats** update instantly.
- **What Should I Pick?** — one button, one AI-written verdict: best pick, alternatives, and picks to avoid, all grounded in the engine's numbers.
- **WHY?** — every recommendation expands into a factor-by-factor breakdown (Counter, Synergy, Role fit, Lane, Teamfight, Meta, Flexibility) with a confidence tag (curated / estimated / live / insufficient data) on each bar, plus an AI explanation of strengths and risks.
- **Pick Explorer** — pick any hero and see its profile, best allies, worst enemies, how it fares against the *current* enemy draft, and its score for the *current* draft.
- **Draft Simulator** — a sandbox to freely try 5v5 compositions and see an overall Draft Score, power curve, major threats, and AI-written weaknesses/recommended changes.
- **Compare** — put 2–3 heroes side by side across every scoring factor plus an AI verdict on which fits *this* draft best.
- **Settings** — AI provider & key, language (EN/RU), data source (offline snapshot vs. live OpenDota stats), scoring weights (live sliders, no code changes needed), theme, hotkey, privacy toggles, cache controls, optional Player Profile.
- **History** — save the current draft plus its full recommendation snapshot to a real local SQLite database, reopen it later.
- **Win Condition** — for each side, a plain description of its likely win condition (phase + shape), derived transparently from picks, never asserted with false certainty when there's too little data.
- **Recommendation badges** — Best Pick / Alternative / Safe Pick / High Ceiling / Comfort Pick, each reflecting a real derived property of the candidate, not a cosmetic label.
- **What-If** — in Pick Explorer, see the draft-composition score before and after picking the selected hero into your next open slot.
- **Player Profile** (optional, off by default) — comfort heroes, heroes to avoid, preferred positions, experience level. Produces a separate "Player Fit" number; it is never blended into the objective score.

## Architecture

```
src/
  types/        Shared domain types (hero, draft, scoring, ai, settings)
  data/         Level-1 data layer: bundled hero roster, curated matchup/
                synergy overrides, DataSource abstraction, OpenDota-backed
                RemoteDataSource, DataRepository (fallback chain), cache
  patch/        PatchManager — tracks the active patch, never mixes stats
                from different patches, degrades to the last valid snapshot
  analytics/    Level-1 engine: CounterEngine, SynergyEngine, RoleAnalyzer,
                PickScorer (weighted combination), BanRecommender,
                DraftAnalyzer (orchestrator), DraftScore (simulator),
                weights.config.ts (editable scoring weights)
  ai/           Level-2 explanation layer: AIProvider interface +
                Anthropic/OpenAI/Compatible/Null implementations,
                ai/prompts/ (one file per use case), AIService
                (debounce, cache, graceful fallback to local-engine text)
  draft/        Draft state (zustand store) + paste-draft parser
  settings/     Settings state (incl. Player Profile, feature flags), persisted via data/cache.ts
  store/        UI state (active tab, modals) and live-stats state
  components/   Reusable UI (HeroBadge, ScoreBar, Panel, Modal, WhyBreakdown, FirstRunModal, ...)
  features/     Pages: live-draft, pick-explorer, simulator, compare, history, settings
  i18n/         react-i18next setup + en/ru locale files
src-tauri/      Tauri (Rust) desktop shell: window, HTTP/store/fs/sql/global-shortcut plugins,
                SQLite migrations for Draft History
docs/           ARCHITECTURE.md, DATA.md, DRAFT_ENGINE.md, SECURITY.md
```

**Design principle:** UI never talks to an API directly, and the AI layer never invents numbers. `analytics/` is a pure, synchronous, fully unit-tested engine that turns hero capability data into scores; `ai/` only explains those already-computed scores in natural language, and always degrades to a plain-text rendering of the same data when no AI provider is configured or a request fails.

### Where the hero data comes from

Hero identity, roles, positions and a hand-curated **capability vector** (control, mobility, tankiness, teamfight, pushing, sustain, burst, aoe) ship bundled in `src/data/heroRoster.ts`, plus curated hard-counter and combo overrides in `curatedMatchups.ts` / `curatedSynergies.ts` for well-known interactions (e.g. *Silencer counters Witch Doctor's channeled ultimate*, *Earthshaker + Magnus chain-stun*). Everything else is derived from a transparent heuristic (`heroDefaults.ts`) and marked `estimated` confidence in the UI so you always know which numbers are hand-tuned and which are inferred.

**Live win/pick/ban rates** are never part of that bundled data — they only ever come from `RemoteDataSource` (OpenDota's public `/heroStats` endpoint), and any factor that depends on them is explicitly marked `insufficient` when they're unavailable (offline, rate-limited, or you've chosen the bundled-only data source in Settings).

## Running it

```bash
npm install
npm run dev          # web dev server (fastest iteration loop for UI work)
npm run tauri dev    # full desktop app in dev mode
```

## Testing & building

```bash
npm test             # vitest — analytics engine, AI fallback, data integrity, parser
npx tsc -b --noEmit  # type-check
npm run build         # production web bundle -> dist/
npm run tauri build   # production desktop app -> src-tauri/target/release/
                       #   bundle/deb, bundle/rpm, bundle/appimage on Linux
                       #   (or the platform-native installer on macOS/Windows)
```

This was built and verified end-to-end in this environment: `npm test` (74 tests — analytics engine incl. Golden Draft scenarios, Win Condition Engine, Recommendation Classifier, AI fallback, data integrity, draft-history persistence, paste parser), `tsc -b`, `oxlint` (clean, no warnings), `npm run build`, and a full `tauri build --no-bundle` (Rust compile, including the new SQLite plugin) producing a working native Linux binary — the packaged app was launched under Xvfb and interacted with (adding heroes, opening the WHY breakdown, switching every tab, saving a draft to History and reopening it, confirmed against the actual `.db` file on disk) to confirm it runs correctly, not just compiles.

Test scenarios covered: empty draft, one hero, partial (3v3) draft, complete 5v5 draft, duplicate hero id, invalid/unknown hero id, missing live-stats data, and AI-unavailable (no key / unreachable endpoint) — every one degrades gracefully instead of crashing or fabricating data.

## Adding an AI provider

Go to **Settings → AI Provider**. Three built-in provider implementations exist under `src/ai/providers/`, all behind the same `AIProvider` interface (`src/types/ai.ts`):

- **Anthropic** — needs an API key.
- **OpenAI** — needs an API key.
- **Compatible** — any OpenAI-chat-completions-shaped endpoint (a local model server like LM Studio/Ollama, or a proxy). Needs a base URL, key optional.

API keys are **never** stored in source code. They're kept only in your local settings cache on this device (Tauri's encrypted-at-rest app store on desktop, `localStorage` in a plain browser) and sent only directly to the provider you chose. `.env.example` shows an optional dev-only way to seed a provider on first run.

To add a fourth provider: implement `AIProvider` in `src/ai/providers/YourProvider.ts`, wire it into `AIProviderFactory.ts`, add its id to `AIProviderId` in `types/ai.ts`, and add a Settings option.

## Updating data

**Settings → Data Source → Live (OpenDota) → Update Data.** This fetches current public win/pick rate (Immortal bracket) and pro ban-rate figures from OpenDota's free `heroStats` endpoint and caches them locally with a TTL. If the request fails (offline, rate-limited), the app automatically falls back to the last valid cached snapshot, and finally to the bundled offline data — it never crashes and never mixes stats across patches (see `PatchManager`).

To point the app at a different statistics backend entirely, implement the `DataSource` interface (`src/data/DataSource.ts`) and swap it into `DataRepository` — nothing else in the app needs to change.

## Changing the scoring model

**Settings → Scoring Weights** — eight sliders (Counter effectiveness, Team synergy, Role completion, Lane compatibility, Teamfight synergy, Enemy threat response, Meta relevance, Flexibility), live-editable, no code or restart required. Defaults live in `src/analytics/weights.config.ts`. The scoring math itself (how each 0–100 factor is computed) lives in `src/analytics/PickScorer.ts`, `CounterEngine.ts`, `SynergyEngine.ts`, and `RoleAnalyzer.ts` if you want to change the underlying heuristics rather than just their weights.

## Adding a language

1. Add `src/i18n/locales/<code>.json` with the same key shape as `en.json`.
2. Register it in `src/i18n/index.ts`'s `resources` map.
3. Add a button for it in `SettingsPage.tsx`.

No other code changes needed — the whole UI is driven through `react-i18next` keys.

## AI providers supported

Anthropic, OpenAI, and any OpenAI-compatible endpoint (local or third-party), configurable per Settings without touching code.

## Data used

- **Hero identity/kit data**: bundled, hand-curated snapshot (`Patch 7.39` label), ~125 heroes with capability vectors, curated counters/synergies for well-known interactions.
- **Live stats** (optional): OpenDota's public `heroStats` endpoint, refreshed on demand, cached, with automatic fallback.
- Nothing about your account, matches, or personal data is collected. Draft contents are only sent anywhere if you've configured an AI provider, and only to that provider — the app tells you every time whether a given explanation used AI or ran on the local engine only.

## What works today

- Full draft input (manual pick, search, paste) for both teams and bans
- Real-time, weighted, explainable pick scoring (12 factors) against the current draft
- Ban recommendations, draft-issue detection, enemy-threat ranking with primary/secondary/tertiary tiers
- Per-team Win Condition (phase + shape), honestly marked "insufficient" with too few picks
- Recommendation badges (Best Pick / Alternative / Safe Pick / High Ceiling / Comfort Pick) reflecting real candidate properties
- What-If: before/after draft-composition score for a candidate pick
- Draft History: save/reopen past drafts, backed by a real local SQLite database on desktop
- Optional Player Profile (comfort/avoid heroes, preferred positions, experience) with a separate, non-overriding Player Fit score
- A single, short first-run welcome screen — not a forced multi-step registration flow
- AI-written explanations for picks, comparisons, "what should I pick", and draft summaries — with automatic, honest fallback to local-engine text when AI is unavailable
- Pick Explorer, Draft Simulator, and 2–3-way hero Compare
- i18n (English + Russian) with an architecture that makes adding a language trivial
- Configurable global hotkey to show/hide the window (desktop only, best-effort — never interacts with the game process)
- Offline-first: everything except live stats and AI explanations works with no network at all

## Known limitations

- The bundled capability data for less-iconic heroes is heuristically derived (clearly marked "estimated" in the UI), not individually hand-tuned — the curated overrides focus on well-known, high-signal interactions rather than an exhaustive matchup matrix.
- Live stats currently come from one free public source (OpenDota); pick/ban-rate percentages are derived from raw counts it returns rather than an authoritative total-games figure.
- "Method 4" (reading the draft directly from the game client) was intentionally **not implemented** — the brief explicitly prohibited interacting with the game process, and there's no officially supported, anti-cheat-safe local API for live draft state, so this stays a manual/paste input tool rather than a game-integrated one.
- AI comparisons/explanations are capped at a few hundred tokens to keep them fast and cheap; very long, open-ended free-text Q&A is not the focus (the "what should I pick" / "why" / "compare" flows are).
- This was built and verified in a headless Linux container (Xvfb-driven smoke test, screenshots, and simulated clicks through every tab, including a real save/reopen through the new SQLite-backed History page). It has not been tested against a real display, macOS, or Windows — the Tauri config targets all three, but only the Linux build was compiled and run here.
- **What was scoped out of this round, on purpose, rather than faked:** a genuinely separate always-on-top overlay window with FULL/COMPACT/MINIMAL/HIDDEN modes (today's hotkey shows/hides the single main window, which is the honest v1 behavior, not relabeled as something bigger); a multi-source data-provider priority/versioning/checksum pipeline (there is still exactly one live source, OpenDota, behind the existing fallback chain); a signed, shipped auto-updater (needs code-signing and update hosting this environment doesn't have); a full Playwright E2E suite (covered instead by 74 passing unit/integration tests plus a manual interactive smoke test of the compiled binary); and a multi-step branching "Draft Scenario Tree" (a single-step What-If is implemented — a full response tree would need real branch-probability data that doesn't exist, and inventing it would violate the "no fake data" rule). None of these are stubbed with fake UI — they're simply absent, and nothing in the architecture blocks adding them later.
