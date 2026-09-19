import type { Hero } from '../../types/hero';
import type { FactorScore, PickCandidate } from '../../types/scoring';
import type { AIMessage } from '../../types/ai';
import { WEIGHT_LABELS } from '../../analytics/weights.config';

/**
 * Shared system prompt for every AI call in the app. This is the contract
 * that keeps the LLM in "explainer" role (Level 2) rather than a source of
 * truth about statistics (Level 1's job). It is intentionally strict.
 */
export function systemPreamble(language: 'en' | 'ru'): string {
  const langLine =
    language === 'ru'
      ? 'Отвечай на русском языке.'
      : 'Respond in English.';
  return [
    'You are the explanation layer of a Dota 2 draft-analysis assistant.',
    'You are given structured, pre-computed data from a deterministic analysis engine (matchup scores, synergy scores, role coverage, and optionally live statistics). You do not compute new statistics and you never invent win rates, pick rates, ban rates, or any numeric data that was not given to you.',
    'If a data field is marked "insufficient" or is absent, say plainly that data is insufficient for that point instead of guessing or estimating a number.',
    'Be concise, concrete, and specific to the heroes and factors given — never generic filler like "pick a strong hero".',
    'Structure answers with short headers/bullets when helpful, but keep the whole answer tight (under ~180 words unless asked to compare multiple heroes).',
    langLine,
  ].join(' ');
}

export function formatHeroList(heroes: Hero[]): string {
  if (heroes.length === 0) return '(none)';
  return heroes.map((h) => `${h.localizedName} [${h.roles.join('/')}]`).join(', ');
}

export function formatFactors(factors: FactorScore[]): string {
  return factors
    .map((f) => {
      const label = WEIGHT_LABELS[f.key];
      const conf = f.confidence === 'insufficient' ? 'INSUFFICIENT DATA' : f.confidence;
      return `- ${label}: ${f.score.toFixed(0)}/100 (${conf}) — ${f.reasons.join('; ')}`;
    })
    .join('\n');
}

export function formatCandidate(hero: Hero, candidate: PickCandidate): string {
  return [
    `Hero: ${hero.localizedName} (overall score ${candidate.overallScore}/100)`,
    formatFactors(candidate.factors),
    `Strengths: ${candidate.strengths.join('; ') || '(none flagged)'}`,
    `Risks: ${candidate.risks.join('; ') || '(none flagged)'}`,
  ].join('\n');
}

export function userMessage(content: string): AIMessage {
  return { role: 'user', content };
}

export function systemMessage(content: string): AIMessage {
  return { role: 'system', content };
}
