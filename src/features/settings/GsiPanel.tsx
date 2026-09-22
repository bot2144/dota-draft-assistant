import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { useSettingsStore } from '../../settings/settingsStore';
import { useGsiStatusStore } from '../../gsi/gsiStatusStore';
import type { GsiSettings } from '../../types/settings';
import './GsiPanel.css';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function GsiPanel() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const status = useGsiStatusStore((s) => s.status);
  const gsi = settings.gsi;

  const [candidates, setCandidates] = useState<string[]>([]);
  const [installedPath, setInstalledPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateGsi = (patch: Partial<GsiSettings>) => update({ gsi: { ...gsi, ...patch } });

  const handleFindFolders = async () => {
    setError(null);
    setBusy(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const found = await invoke<string[]>('gsi_find_cfg_dirs');
      setCandidates(found);
      if (found.length === 0) setError(t('gsi.noFoldersFound'));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handlePickFolder = async () => {
    setError(null);
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const picked = await open({ directory: true, multiple: false, title: t('gsi.pickCfgFolder') });
      if (typeof picked === 'string') await handleInstall(picked);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleInstall = async (dir: string) => {
    setError(null);
    setBusy(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await invoke<string>('gsi_write_config', { cfgDir: dir, port: gsi.port });
      setInstalledPath(path);
      await updateGsi({ enabled: true });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!isTauri()) {
    return (
      <Panel title={t('gsi.title')}>
        <p className="settings-hint">{t('gsi.desktopOnly')}</p>
      </Panel>
    );
  }

  return (
    <Panel title={t('gsi.title')}>
      <p className="settings-hint">{t('gsi.explainer')}</p>

      <div className="settings-row settings-row--checkbox">
        <input
          id="gsi-enabled"
          type="checkbox"
          checked={gsi.enabled}
          onChange={(e) => updateGsi({ enabled: e.target.checked })}
        />
        <label htmlFor="gsi-enabled">{t('gsi.enable')}</label>
      </div>

      {gsi.enabled && (
        <>
          <div className="settings-row settings-row--checkbox">
            <input
              id="gsi-autofill"
              type="checkbox"
              checked={gsi.autoFillDraft}
              onChange={(e) => updateGsi({ autoFillDraft: e.target.checked })}
            />
            <label htmlFor="gsi-autofill">{t('gsi.autoFill')}</label>
          </div>

          <div className="settings-row">
            <label>{t('gsi.mySide')}</label>
            <select value={gsi.mySide} onChange={(e) => updateGsi({ mySide: e.target.value as GsiSettings['mySide'] })}>
              <option value="auto">{t('gsi.mySideAuto')}</option>
              <option value="radiant">Radiant</option>
              <option value="dire">Dire</option>
            </select>
          </div>

          <div className="gsi-panel__status">
            <span className={`gsi-panel__dot ${status.running ? 'gsi-panel__dot--on' : ''}`} />
            <span>
              {status.running
                ? status.lastPayloadAt
                  ? t('gsi.statusReceiving')
                  : t('gsi.statusListening', { port: gsi.port })
                : t('gsi.statusOff')}
            </span>
            {status.detectedSide && <span className="gsi-panel__side">({status.detectedSide})</span>}
          </div>
          {status.error && <p className="settings-hint settings-hint--error">{status.error}</p>}
          {status.unmappedHeroes.length > 0 && (
            <p className="settings-hint settings-hint--warn">
              {t('gsi.unmappedHeroes')}: {status.unmappedHeroes.join(', ')}
            </p>
          )}

          <div className="gsi-panel__install">
            <p className="settings-hint">{t('gsi.installHint')}</p>
            <div className="settings-row settings-row--buttons">
              <Button variant="secondary" size="sm" onClick={handleFindFolders} disabled={busy}>
                {t('gsi.findFolders')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePickFolder} disabled={busy}>
                {t('gsi.pickCfgFolder')}
              </Button>
            </div>
            {candidates.length > 0 && (
              <ul className="gsi-panel__candidates">
                {candidates.map((c) => (
                  <li key={c}>
                    <span>{c}</span>
                    <Button variant="primary" size="sm" onClick={() => handleInstall(c)} disabled={busy}>
                      {t('gsi.install')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {installedPath && <p className="settings-hint settings-hint--ok">{t('gsi.installed')}: {installedPath}</p>}
            {error && <p className="settings-hint settings-hint--error">{error}</p>}
          </div>
        </>
      )}
    </Panel>
  );
}
