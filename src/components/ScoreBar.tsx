import type { DataConfidence } from '../types/hero';
import { ConfidenceTag } from './ConfidenceTag';
import './ScoreBar.css';

interface ScoreBarProps {
  label: string;
  score: number; // 0-100
  confidence?: DataConfidence | 'insufficient';
  compact?: boolean;
}

function colorFor(score: number): string {
  if (score >= 70) return 'var(--ok)';
  if (score >= 45) return 'var(--warn)';
  return 'var(--danger)';
}

export function ScoreBar({ label, score, confidence, compact }: ScoreBarProps) {
  return (
    <div className={`score-bar ${compact ? 'score-bar--compact' : ''}`}>
      <div className="score-bar__head">
        <span className="score-bar__label">{label}</span>
        <span className="score-bar__value">
          {Math.round(score)}
          {confidence && confidence !== 'estimated' && <ConfidenceTag confidence={confidence} />}
        </span>
      </div>
      <div className="score-bar__track">
        <div className="score-bar__fill" style={{ width: `${score}%`, background: colorFor(score) }} />
      </div>
    </div>
  );
}
