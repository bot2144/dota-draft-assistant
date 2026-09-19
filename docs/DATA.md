# Data

## Hero identity & kit data

Bundled, hand-curated, `src/data/heroRoster.ts` (~125 heroes). Confidence-tagged (`curated` for hand-tuned capability vectors, `estimated` for `heroDefaults.ts`-derived ones). Never claims to be live statistics.

## Live statistics

Only ever from `RemoteDataSource` (OpenDota's public `/heroStats` endpoint). Verified against OpenDota's own public documentation before integrating; no invented endpoint. Anything derived from it is tagged `live`; anything missing is tagged `insufficient` and rendered as "Insufficient data" rather than guessed.

`DataRepository` fallback chain: live fetch → last valid cached snapshot (even if stale) → bundled offline data. Never mixes data across patches (`PatchManager`).

## Draft History (new in v2)

Backed by a **real local SQLite database** on desktop, via `tauri-plugin-sql`. Schema lives in `src-tauri/src/lib.rs`'s `migrations()` function:

```sql
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  patch TEXT NOT NULL,
  ally_heroes TEXT NOT NULL,
  enemy_heroes TEXT NOT NULL,
  analysis_snapshot TEXT NOT NULL,
  label TEXT
);
```

Migrations are versioned and additive only — a future migration may add columns/tables but must never `DROP` or rewrite this table, so an app update never destroys a user's saved draft history. Verified in this build: `sqlite3` file created at `~/.config/<bundle-id>/dota-assistant.db`, a real row written and read back via the app's own UI (see PR/session notes — not just unit-tested, exercised end-to-end through the compiled binary).

In a plain browser/test context (no Tauri runtime — `npm run dev`, `npx vitest`), the same `src/data/historyStore.ts` API degrades to a bounded JSON array in `localStorage`, so History still works, just without a real relational store backing it. This is stated plainly rather than silently pretending SQLite is present where it isn't.

## Why not a full 14-table schema

The v2 spec sketches a broader schema (heroes, abilities, roles, matchups, synergies, statistics, patches, datasets, player_profile, cache, update_logs, ...). Hero/ability/matchup/synergy data is intentionally kept as reviewed, versioned **source code** (`heroRoster.ts`, `curatedMatchups.ts`, `curatedSynergies.ts`) rather than a mutable database table: it is small, hand-curated, and code review is a stronger integrity guarantee for it than a runtime-writable table would be. `settings` and `player_profile` are a single JSON document each (not a growing list), so the existing `cache.ts` key/value store (Tauri Store plugin, `localStorage` fallback) already gives them robust, corruption-safe local persistence without the added complexity of a schema migration for a single row. SQLite was reserved for `drafts`, the one genuinely relational, growing dataset — that's where a real database earns its complexity.
