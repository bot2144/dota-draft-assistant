import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { useSettingsStore } from '../settings/settingsStore';

/**
 * A single, short first-run screen — not a multi-step registration flow.
 * Confirms the app is local-first and lets the user get straight to the
 * Draft screen; language and AI provider can always be changed later in
 * Settings, so nothing here is a one-way decision.
 */
export function FirstRunModal() {
  const { t } = useTranslation();
  const update = useSettingsStore((s) => s.update);

  return (
    <Modal title={t('onboarding.welcome')} onClose={() => update({ onboarded: true })}>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{t('onboarding.body')}</p>
      <Button onClick={() => update({ onboarded: true })}>{t('onboarding.getStarted')}</Button>
    </Modal>
  );
}
