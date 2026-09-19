import type { Hero } from '../../types/hero';
import type { PickCandidate } from '../../types/scoring';
import type { AIMessage } from '../../types/ai';
import { systemPreamble, systemMessage, userMessage, formatCandidate, formatHeroList } from './shared';

export function buildPickExplanationPrompt(
  hero: Hero,
  candidate: PickCandidate,
  allyTeam: Hero[],
  enemyTeam: Hero[],
  language: 'en' | 'ru'
): AIMessage[] {
  const user = [
    `Our team so far: ${formatHeroList(allyTeam)}`,
    `Enemy team so far: ${formatHeroList(enemyTeam)}`,
    '',
    `Explain why the analysis engine recommends this pick, using ONLY the data below:`,
    formatCandidate(hero, candidate),
    '',
    'Write: a one-line verdict, then "Why" (2-4 bullets grounded in the factors above), then "Risks" (1-3 bullets), then one "Alternative to consider" sentence if the data suggests one.',
  ].join('\n');

  return [systemMessage(systemPreamble(language)), userMessage(user)];
}
