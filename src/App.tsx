import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavTabs } from './components/NavTabs';
import { LiveDraftPage } from './features/live-draft/LiveDraftPage';
import { PickExplorerPage } from './features/pick-explorer/PickExplorerPage';
import { SimulatorPage } from './features/simulator/SimulatorPage';
import { ComparePage } from './features/compare/ComparePage';
import { HistoryPage } from './features/history/HistoryPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { FirstRunModal } from './components/FirstRunModal';
import { useUIStore } from './store/uiStore';
import { useSettingsStore } from './settings/settingsStore';
import { useLiveDataStore } from './store/liveDataStore';
import { HERO_COUNT } from './data/heroes';
import { useGsiIntegration } from './gsi/useGsiIntegration';
import './App.css';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Registers the configurable global hotkey to show/hide the companion window (desktop only, best-effort). */
function useGlobalHotkey(hotkey: string) {
  useEffect(() => {
    if (!isTauri()) return;
    let unregister: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const [{ register, unregisterAll }, { getCurrentWindow }] = await Promise.all([
          import('@tauri-apps/plugin-global-shortcut'),
          import('@tauri-apps/api/window'),
        ]);
        if (cancelled) return;
        const win = getCurrentWindow();
        await register(hotkey, async () => {
          const visible = await win.isVisible();
          if (visible) await win.hide();
          else {
            await win.show();
            await win.setFocus();
          }
        });
        unregister = () => {
          unregisterAll().catch(() => {});
        };
      } catch {
        // Hotkey registration is best-effort — never break the app if it fails
        // (e.g. the combo is already taken by another application).
      }
    })();

    return () => {
      cancelled = true;
      unregister?.();
    };
  }, [hotkey]);
}

/** Keeps this app's own window above other windows when enabled (desktop only, best-effort). Never touches the game process. */
function useAlwaysOnTop(enabled: boolean) {
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        if (cancelled) return;
        await getCurrentWindow().setAlwaysOnTop(enabled);
      } catch {
        // Best-effort — never break the app if this fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}

function App() {
  const { t, i18n } = useTranslation();
  const view = useUIStore((s) => s.view);
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const load = useSettingsStore((s) => s.load);
  const refreshLiveData = useLiveDataStore((s) => s.refresh);
  const patchLabel = useLiveDataStore((s) => s.patchLabel);
  const dataStatus = useLiveDataStore((s) => s.status);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loaded) {
      i18n.changeLanguage(settings.language);
      refreshLiveData(settings.dataSource);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useGlobalHotkey(settings.hotkeys.toggleOverlay);
  useAlwaysOnTop(settings.alwaysOnTop);
  useGsiIntegration(settings.gsi);

  if (!loaded) {
    return <div className="app-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__title">{t('app.title')}</span>
          <span className="app-header__tagline">{t('app.tagline')}</span>
        </div>
        <NavTabs />
        <div className="app-header__status">
          <span title={`${HERO_COUNT} heroes loaded`}>{patchLabel}</span>
          <span className={`app-header__dot ${dataStatus.usingLiveStats ? 'app-header__dot--live' : ''}`} />
        </div>
      </header>

      <main className="app-main">
        {view === 'live-draft' && <LiveDraftPage />}
        {view === 'explorer' && <PickExplorerPage />}
        {view === 'simulator' && <SimulatorPage />}
        {view === 'compare' && <ComparePage />}
        {view === 'history' && <HistoryPage />}
        {view === 'settings' && <SettingsPage />}
      </main>
      {!settings.onboarded && <FirstRunModal />}
    </div>
  );
}

export default App;
