/**
 * Draft History persistence.
 *
 * On desktop (Tauri), this is backed by a real local SQLite database
 * (`tauri-plugin-sql`, schema managed by versioned migrations in
 * `src-tauri/src/lib.rs` — see `migrations()`, which only ever ADDs
 * structure so an app update never destroys previously saved history).
 *
 * In a plain browser (dev server, tests, no Tauri runtime), there is no
 * SQLite available, so this degrades to a JSON array in localStorage with
 * the exact same shape and API — draft history still works, just without
 * a real relational store backing it.
 */
import type { DraftAnalysis } from '../types/scoring';

export interface DraftHistoryEntry {
  id: string;
  createdAt: string; // ISO
  patch: string;
  allyHeroes: string[];
  enemyHeroes: string[];
  analysisSnapshot: DraftAnalysis;
  label?: string;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const LOCAL_KEY = 'draft-history-fallback-v1';
const DB_URL = 'sqlite:dota-assistant.db';

let dbPromise: Promise<import('@tauri-apps/plugin-sql').default> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = import('@tauri-apps/plugin-sql').then((m) => m.default.load(DB_URL));
  }
  return dbPromise;
}

function readLocalFallback(): DraftHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DraftHistoryEntry[];
  } catch {
    return [];
  }
}

function writeLocalFallback(entries: DraftHistoryEntry[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  } catch {
    // best-effort only
  }
}

export async function saveDraftHistory(entry: Omit<DraftHistoryEntry, 'id' | 'createdAt'>): Promise<DraftHistoryEntry | undefined> {
  const full: DraftHistoryEntry = {
    ...entry,
    id: crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  try {
    if (isTauri()) {
      const db = await getDb();
      await db.execute(
        'INSERT INTO drafts (id, created_at, patch, ally_heroes, enemy_heroes, analysis_snapshot, label) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          full.id,
          full.createdAt,
          full.patch,
          JSON.stringify(full.allyHeroes),
          JSON.stringify(full.enemyHeroes),
          JSON.stringify(full.analysisSnapshot),
          full.label ?? null,
        ]
      );
    } else {
      const entries = readLocalFallback();
      entries.unshift(full);
      writeLocalFallback(entries.slice(0, 200)); // keep local fallback bounded
    }
    return full;
  } catch (err) {
    console.error('Failed to save draft history', err);
    return undefined;
  }
}

interface DraftRow {
  id: string;
  created_at: string;
  patch: string;
  ally_heroes: string;
  enemy_heroes: string;
  analysis_snapshot: string;
  label: string | null;
}

function rowToEntry(row: DraftRow): DraftHistoryEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    patch: row.patch,
    allyHeroes: JSON.parse(row.ally_heroes),
    enemyHeroes: JSON.parse(row.enemy_heroes),
    analysisSnapshot: JSON.parse(row.analysis_snapshot),
    label: row.label ?? undefined,
  };
}

export async function listDraftHistory(limit = 50): Promise<DraftHistoryEntry[]> {
  try {
    if (isTauri()) {
      const db = await getDb();
      const rows = await db.select<DraftRow[]>('SELECT * FROM drafts ORDER BY created_at DESC LIMIT $1', [limit]);
      return rows.map(rowToEntry);
    }
    return readLocalFallback().slice(0, limit);
  } catch (err) {
    console.error('Failed to list draft history', err);
    return [];
  }
}

export async function deleteDraftHistory(id: string): Promise<void> {
  try {
    if (isTauri()) {
      const db = await getDb();
      await db.execute('DELETE FROM drafts WHERE id = $1', [id]);
    } else {
      writeLocalFallback(readLocalFallback().filter((e) => e.id !== id));
    }
  } catch (err) {
    console.error('Failed to delete draft history entry', err);
  }
}

export async function clearDraftHistory(): Promise<void> {
  try {
    if (isTauri()) {
      const db = await getDb();
      await db.execute('DELETE FROM drafts');
    } else {
      writeLocalFallback([]);
    }
  } catch (err) {
    console.error('Failed to clear draft history', err);
  }
}
