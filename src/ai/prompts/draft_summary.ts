import type { Hero } from '../../types/hero';
import type { DraftAnalysis } from '../../types/scoring';
import type { AIMessage } from '../../types/ai';
import { systemPreamble, systemMessage, userMessage, formatHeroList } from './shared';

export function buildDraftSummaryPrompt(
  allyTeam: Hero[],
  enemyTeam: Hero[],
  analysis: DraftAnalysis,
  language: 'en' | 'ru'
): AIMessage[] {
  const threats = analysis.enemyThreats
    .map((t) => `- ${t.heroId} (threat ${t.threatLevel.toFixed(0)}/100): ${t.reason}`)
    .join('\n') || '(none)';
  const issues = analysis.allyIssues.map((i) => `- (${i.severity}) ${i.message}`).join('\n') || '(none)';

  const user = [
    `Our team: ${formatHeroList(allyTeam)}`,
    `Enemy team: ${formatHeroList(enemyTeam)}`,
    `Enemy threats detected:\n${threats}`,
    `Draft issues detected:\n${issues}`,
    '',
    'Summarize this draft in three short sections: "Strengths", "Weaknesses", "Game plan" (one or two sentences on how this team should try to win, grounded only in the data above).',
  ].join('\n');

  return [systemMessage(systemPreamble(language)), userMessage(user)];
}
