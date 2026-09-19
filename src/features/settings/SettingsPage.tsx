import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../settings/settingsStore';
import { useLiveDataStore } from '../../store/liveDataStore';
import { DEFAULT_WEIGHTS, WEIGHT_LABELS } from '../../analytics/weights.config';
import { Panel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { HeroPicker } from '../../components/HeroPicker';
import { HeroGlyph } from '../../components/HeroBadge';
import { getHero } from '../../data/heroes';
import type { AIProviderId } from '../../types/ai';
import type { ScoreFactorKey } from '../../types/scoring';
import type { DataSourceMode, Language } from '../../types/settings';
import type { ExperienceLevel } from '../../types/player';
import { cacheClear } from '../../data/cache';
import './SettingsPage.css';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);
  const refreshLiveData = useLiveDataStore((s) => s.refresh);
  const dataStatus = useLiveDataStore((s) => s.status);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pickingComfort, setPickingComfort] = useState(false);
  const [pickingAvoid, setPickingAvoid] = useState(false);
  const profile = settings.playerProfile;

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const handleLanguage = (lang: Language) => {
    update({ language: lang });
    i18n.changeLanguage(lang);
    flashSaved();
  };

  const handleDataSource = async (mode: DataSourceMode) => {
    await update({ dataSource: mode });
    setRefreshing(true);
    await refreshLiveData(mode);
    setRefreshing(false);
    flashSaved();
  };

  const handleUpdateData = async () => {
    setRefreshing(true);
    await refreshLiveData(settings.dataSource, { forceRefresh: true });
    setRefreshing(false);
    flashSaved();
  };

  const handleWeightChange = (key: ScoreFactorKey, value: number) => {
    update({ weights: { ...settings.weights, [key]: value / 100 } });
  };

  return (
    <div className="settings-page">
      <Panel title={t('settings.aiProvider')}>
        <div className="settings-row">
          <label>{t('settings.aiProvider')}</label>
          <select
            value={settings.ai.provider}
            onChange={(e) => update({ ai: { ...settings.ai, provider: e.target.value as AIProviderId } })}
          >
            <option value="none">None (local engine only)</option>
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="compatible">Compatible (OpenAI-style endpoint)</option>
          </select>
        </div>
        {settings.ai.provider !== 'none' && (
          <>
            {settings.ai.provider !== 'compatible' && (
              <div className="settings-row">
                <label>{t('settings.apiKey')}</label>
                <input
                  type="password"
                  value={settings.ai.apiKey ?? ''}
                  onChange={(e) => update({ ai: { ...settings.ai, apiKey: e.target.value } })}
                  placeholder="sk-..."
                />
              </div>
            )}
            {settings.ai.provider === 'compatible' && (
              <div className="settings-row">
                <label>{t('settings.baseUrl')}</label>
                <input
                  value={settings.ai.baseUrl ?? ''}
                  onChange={(e) => update({ ai: { ...settings.ai, baseUrl: e.target.value } })}
                  placeholder="http://localhost:1234/v1"
                />
              </div>
            )}
            <div className="settings-row">
              <label>{t('settings.model')}</label>
              <input
                value={settings.ai.model ?? ''}
                onChange={(e) => update({ ai: { ...settings.ai, model: e.target.value } })}
                placeholder="(default)"
              />
            </div>
          </>
        )}
        <p className="settings-hint">
          API keys are stored only in your local settings cache on this device, never in source code or sent anywhere
          except directly to the provider you choose.
        </p>
      </Panel>

      <Panel title={t('settings.language')}>
        <div className="settings-row settings-row--buttons">
          <Button variant={settings.language === 'en' ? 'primary' : 'secondary'} size="sm" onClick={() => handleLanguage('en')}>
            English
          </Button>
          <Button variant={settings.language === 'ru' ? 'primary' : 'secondary'} size="sm" onClick={() => handleLanguage('ru')}>
            Русский
          </Button>
        </div>
      </Panel>

      <Panel title={t('settings.dataSource')}>
        <div className="settings-row settings-row--buttons">
          <Button variant={settings.dataSource === 'bundled' ? 'primary' : 'secondary'} size="sm" onClick={() => handleDataSource('bundled')}>
            Bundled snapshot (offline)
          </Button>
          <Button
            variant={settings.dataSource === 'remote-opendota' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleDataSource('remote-opendota')}
          >
            Live (OpenDota)
          </Button>
        </div>
        <p className="settings-hint">
          {dataStatus.usingLiveStats
            ? `${t('settings.dataStatusLive')}${dataStatus.lastUpdated ? ` — ${new Date(dataStatus.lastUpdated).toLocaleString()}` : ''}`
            : dataStatus.lastError
              ? `${t('settings.dataStatusStale')}: ${dataStatus.lastError}`
              : t('settings.dataStatusBundled')}
        </p>
        <Button variant="secondary" size="sm" onClick={handleUpdateData} disabled={refreshing}>
          {refreshing ? t('common.loading') : t('settings.updateData')}
        </Button>
      </Panel>

      <Panel title={t('settings.weights')}>
        {(Object.keys(WEIGHT_LABELS) as ScoreFactorKey[]).map((key) => (
          <div className="settings-weight-row" key={key}>
            <label>{WEIGHT_LABELS[key]}</label>
            <input
              type="range"
              min={0}
              max={50}
              value={Math.round(settings.weights[key] * 100)}
              onChange={(e) => handleWeightChange(key, Number(e.target.value))}
            />
            <span>{Math.round(settings.weights[key] * 100)}%</span>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => update({ weights: DEFAULT_WEIGHTS })}>
          {t('settings.resetWeights')}
        </Button>
      </Panel>

      <Panel title={t('settings.privacy')}>
        <div className="settings-row settings-row--checkbox">
          <input
            id="allow-ai"
            type="checkbox"
            checked={settings.privacy.allowAIRequests}
            onChange={(e) => update({ privacy: { ...settings.privacy, allowAIRequests: e.target.checked } })}
          />
          <label htmlFor="allow-ai">{t('settings.allowAIRequests')}</label>
        </div>
        <div className="settings-row settings-row--checkbox">
          <input
            id="share-draft"
            type="checkbox"
            checked={settings.privacy.shareDraftWithAI}
            onChange={(e) => update({ privacy: { ...settings.privacy, shareDraftWithAI: e.target.checked } })}
          />
          <label htmlFor="share-draft">{t('settings.shareDraftWithAI')}</label>
        </div>
      </Panel>

      <Panel title={t('playerProfile.title')}>
        <p className="settings-hint">{t('playerProfile.hint')}</p>
        <div className="settings-row settings-row--checkbox">
          <input
            id="player-profile-enable"
            type="checkbox"
            checked={profile.enabled}
            onChange={(e) => update({ playerProfile: { ...profile, enabled: e.target.checked } })}
          />
          <label htmlFor="player-profile-enable">{t('playerProfile.enable')}</label>
        </div>

        {profile.enabled && (
          <>
            <div className="settings-row">
              <label>{t('playerProfile.experienceLevel')}</label>
              <select
                value={profile.experienceLevel}
                onChange={(e) => update({ playerProfile: { ...profile, experienceLevel: e.target.value as ExperienceLevel } })}
              >
                <option value="new">{t('playerProfile.expNew')}</option>
                <option value="casual">{t('playerProfile.expCasual')}</option>
                <option value="competitive">{t('playerProfile.expCompetitive')}</option>
              </select>
            </div>

            <div className="settings-hero-list">
              <label>{t('playerProfile.comfortHeroes')}</label>
              <div className="settings-hero-chips">
                {profile.comfortHeroIds.map((id) => {
                  const hero = getHero(id);
                  return hero ? (
                    <span key={id} className="settings-hero-chip">
                      <HeroGlyph hero={hero} size="sm" />
                      {hero.localizedName}
                      <button onClick={() => update({ playerProfile: { ...profile, comfortHeroIds: profile.comfortHeroIds.filter((h) => h !== id) } })}>
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
                <Button variant="ghost" size="sm" onClick={() => setPickingComfort(true)}>
                  {t('playerProfile.addHero')}
                </Button>
              </div>
            </div>

            <div className="settings-hero-list">
              <label>{t('playerProfile.avoidHeroes')}</label>
              <div className="settings-hero-chips">
                {profile.avoidHeroIds.map((id) => {
                  const hero = getHero(id);
                  return hero ? (
                    <span key={id} className="settings-hero-chip">
                      <HeroGlyph hero={hero} size="sm" />
                      {hero.localizedName}
                      <button onClick={() => update({ playerProfile: { ...profile, avoidHeroIds: profile.avoidHeroIds.filter((h) => h !== id) } })}>
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
                <Button variant="ghost" size="sm" onClick={() => setPickingAvoid(true)}>
                  {t('playerProfile.addHero')}
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>

      <Panel title={t('settings.hotkeys')}>
        <div className="settings-row">
          <label>{t('settings.toggleOverlay')}</label>
          <input
            value={settings.hotkeys.toggleOverlay}
            onChange={(e) => update({ hotkeys: { ...settings.hotkeys, toggleOverlay: e.target.value } })}
          />
        </div>
      </Panel>

      <Panel title={t('settings.cache')}>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            await cacheClear('data-repository:live-stats');
            flashSaved();
          }}
        >
          {t('settings.clearCache')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => reset()}>
          Reset all settings
        </Button>
      </Panel>

      {saved && <div className="settings-page__saved">{t('settings.saved')}</div>}

      {pickingComfort && (
        <Modal title={t('playerProfile.comfortHeroes')} onClose={() => setPickingComfort(false)}>
          <HeroPicker
            excludeIds={new Set(profile.comfortHeroIds)}
            onPick={(id) => {
              update({ playerProfile: { ...profile, comfortHeroIds: [...profile.comfortHeroIds, id] } });
              setPickingComfort(false);
            }}
          />
        </Modal>
      )}
      {pickingAvoid && (
        <Modal title={t('playerProfile.avoidHeroes')} onClose={() => setPickingAvoid(false)}>
          <HeroPicker
            excludeIds={new Set(profile.avoidHeroIds)}
            onPick={(id) => {
              update({ playerProfile: { ...profile, avoidHeroIds: [...profile.avoidHeroIds, id] } });
              setPickingAvoid(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
