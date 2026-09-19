import { useTranslation } from 'react-i18next';
import type { DataConfidence } from '../types/hero';
import './ConfidenceTag.css';

export function ConfidenceTag({ confidence }: { confidence: DataConfidence | 'insufficient' }) {
  const { t } = useTranslation();
  const labelKey =
    confidence === 'curated'
      ? 'common.confidenceCurated'
      : confidence === 'live'
        ? 'common.confidenceLive'
        : confidence === 'insufficient'
          ? 'common.confidenceInsufficient'
          : 'common.confidenceEstimated';
  return <span className={`confidence-tag confidence-tag--${confidence}`}>{t(labelKey)}</span>;
}
