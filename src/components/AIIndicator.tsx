import { useTranslation } from 'react-i18next';
import './AIIndicator.css';

interface AIIndicatorProps {
  usedAI: boolean;
  loading?: boolean;
  errorKind?: string;
}

/** Privacy transparency: always show the user whether AI was actually used for a given piece of text. */
export function AIIndicator({ usedAI, loading, errorKind }: AIIndicatorProps) {
  const { t } = useTranslation();
  if (loading) {
    return <span className="ai-indicator ai-indicator--loading">{t('common.loading')}</span>;
  }
  return (
    <span className={`ai-indicator ${usedAI ? 'ai-indicator--on' : 'ai-indicator--off'}`}>
      <span className="ai-indicator__dot" />
      {usedAI ? t('settings.aiIndicatorOn') : t('settings.aiIndicatorOff')}
      {errorKind && !usedAI && errorKind !== 'no-api-key' && ` (${errorKind})`}
    </span>
  );
}
