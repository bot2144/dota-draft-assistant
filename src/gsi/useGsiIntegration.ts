import { useEffect, useRef } from 'react';
import type { GsiSettings } from '../types/settings';
import { useDraftStore } from '../draft/draftStore';
import { parseDraftFromGsiPayload } from './gsiParser';
import { ALL_HEROES } from '../data/heroes';
import { useGsiStatusStore } from './gsiStatusStore';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const ALL_SLUGS = ALL_HEROES.map((h) => h.id);

/**
 * Starts the local Dota 2 GSI listener (desktop only) when enabled, and
 * auto-fills the draft board from live picks/bans as they happen. Manual
 * entry always keeps working — this only ever *adds* a hero that GSI
 * reports and the board doesn't have yet; it never removes or overrides.
 *
 * GSI is Valve's own officially-documented local integration, not any form
 * of game-process/memory access — see src-tauri/src/gsi.rs for the server.
 * Mount this once (in App.tsx) — status is shared via gsiStatusStore so
 * other components (e.g. the Settings panel) can display it without
 * starting a second listener.
 */
export function useGsiIntegration(settings: GsiSettings): void {
  const addHero = useDraftStore((s) => s.addHero);
  const toggleBan = useDraftStore((s) => s.toggleBan);
  const draft = useDraftStore((s) => s.draft);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const detectedSideRef = useRef<'radiant' | 'dire' | null>(null);
  const setStatus = useGsiStatusStore((s) => s.set);
  const addUnmapped = useGsiStatusStore((s) => s.addUnmapped);

  useEffect(() => {
    if (!isTauri() || !settings.enabled) {
      setStatus({ running: false });
      return;
    }

    let unlisten: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        await invoke('gsi_start', { port: settings.port });
        if (cancelled) return;
        setStatus({ running: true, error: null });

        unlisten = await listen<unknown>('gsi-update', (event) => {
          const parsed = parseDraftFromGsiPayload(event.payload, ALL_SLUGS);
          if (parsed.mySide) detectedSideRef.current = parsed.mySide;

          setStatus({ lastPayloadAt: Date.now(), detectedSide: detectedSideRef.current });
          addUnmapped(parsed.unmapped);

          if (!settings.autoFillDraft) return;

          const mySide = settings.mySide === 'auto' ? detectedSideRef.current : settings.mySide;
          if (!mySide) return; // don't guess which side is ours

          const allySide = mySide === 'radiant' ? 'ally' : 'enemy';
          const enemySide = mySide === 'radiant' ? 'enemy' : 'ally';

          const currentDraft = draftRef.current;
          const alreadyIn = (side: 'ally' | 'enemy') =>
            new Set(currentDraft[side].map((s) => s.heroId).filter(Boolean) as string[]);

          const allyKnown = alreadyIn('ally');
          const enemyKnown = alreadyIn('enemy');

          const allyPicks = mySide === 'radiant' ? parsed.radiantPicks : parsed.direPicks;
          const enemyPicks = mySide === 'radiant' ? parsed.direPicks : parsed.radiantPicks;
          const allyBans = mySide === 'radiant' ? parsed.radiantBans : parsed.direBans;
          const enemyBans = mySide === 'radiant' ? parsed.direBans : parsed.radiantBans;

          for (const heroId of allyPicks) if (!allyKnown.has(heroId)) addHero(allySide, heroId);
          for (const heroId of enemyPicks) if (!enemyKnown.has(heroId)) addHero(enemySide, heroId);
          for (const heroId of allyBans) if (!currentDraft.allyBans.includes(heroId)) toggleBan('ally', heroId);
          for (const heroId of enemyBans) if (!currentDraft.enemyBans.includes(heroId)) toggleBan('enemy', heroId);
        });
      } catch (e) {
        if (!cancelled) setStatus({ running: false, error: String(e) });
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
    // Intentionally re-subscribes only on these — draft/detectedSide are read
    // through refs so a fresh payload always sees current state without
    // needing to be in this dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.enabled, settings.port, settings.autoFillDraft, settings.mySide]);
}
