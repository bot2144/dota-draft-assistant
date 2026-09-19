import type { Hero } from '../../types/hero';
import type { PickCandidate } from '../../types/scoring';
import type { AIMessage } from '../../types/ai';
import { systemPreamble, systemMessage, userMessage, formatCandidate, formatHeroList } from './shared';

export function buildHeroComparisonPrompt(
  entries: { hero: Hero; candidate: PickCandidate }[],
  allyTeam: Hero[],
  enemyTeam: Hero[],
  language: 'en' | 'ru'
): AIMessage[] {
  const block = entries.map(({ hero, candidate }) => formatCandidate(hero, candidate)).join('\n\n');
  const user = [
    `Our team: ${formatHeroList(allyTeam)}`,
    `Enemy team: ${formatHeroList(enemyTeam)}`,
    '',
    `Compare these ${entries.length} candidates using ONLY the data below:`,
    block,
    '',
    'For each hero give one line on where it wins vs the others. Then a one-line final recommendation naming the best fit for THIS specific draft (not in general).',
  ].join('\n');

  return [systemMessage(systemPreamble(language)), userMessage(user)];
}
