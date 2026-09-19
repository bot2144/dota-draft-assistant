import type { Hero } from '../../types/hero';
import type { DraftAnalysis } from '../../types/scoring';
import type { AIMessage } from '../../types/ai';
import { systemPreamble, systemMessage, userMessage, formatHeroList } from './shared';

/**
 * General "analyze the whole current draft situation" prompt — used for
 * free-form questions the user types about the draft (broader than a
 * specific pick/comparison/summary).
 */
export function buildDraftAnalysisPrompt(
  allyTeam: Hero[],
  enemyTeam: Hero[],
  analysis: DraftAnalysis,
  question: string,
  language: 'en' | 'ru'
): AIMessage[] {
  const bans = analysis.recommendedBans.map((b) => `- ${b.heroId} (${b.score}/100): ${b.reason}`).join('\n') || '(none)';
  const issues = analysis.allyIssues.map((i) => `- (${i.severity}) ${i.message}`).join('\n') || '(none)';

  const user = [
    `Our team: ${formatHeroList(allyTeam)}`,
    `Enemy team: ${formatHeroList(enemyTeam)}`,
    `Recommended bans from the engine:\n${bans}`,
    `Draft issues detected:\n${issues}`,
    '',
    `User question: ${question}`,
    '',
    'Answer the question directly and concisely, grounded only in the data above and general Dota 2 kit knowledge — do not invent statistics.',
  ].join('\n');

  return [systemMessage(systemPreamble(language)), userMessage(user)];
}
