import type { Hero } from '../../types/hero';
import type { DraftAnalysis, PickCandidate } from '../../types/scoring';
import type { AIMessage } from '../../types/ai';
import { systemPreamble, systemMessage, userMessage, formatCandidate, formatHeroList } from './shared';

export function buildWhatShouldIPickPrompt(
  allyTeam: Hero[],
  enemyTeam: Hero[],
  top: { hero: Hero; candidate: PickCandidate }[],
  analysis: DraftAnalysis,
  language: 'en' | 'ru'
): AIMessage[] {
  const issuesText = analysis.allyIssues.map((i) => `- (${i.severity}) ${i.message}`).join('\n') || '(none)';
  const topText = top
    .map(({ hero, candidate }, i) => `#${i + 1} ${formatCandidate(hero, candidate)}`)
    .join('\n\n');

  const user = [
    `Our team: ${formatHeroList(allyTeam)}`,
    `Enemy team: ${formatHeroList(enemyTeam)}`,
    `Current draft issues detected by the engine:\n${issuesText}`,
    '',
    `Top-ranked candidates from the analysis engine:\n${topText}`,
    '',
    'Produce: "BEST PICK" (name + score + why, grounded only in the data above), "ALTERNATIVES" (2 heroes with score + one-line reason each), and "AVOID" (1 weak candidate from the list if any scored notably lower, with a one-line reason — omit this section if all candidates are close).',
  ].join('\n');

  return [systemMessage(systemPreamble(language)), userMessage(user)];
}
