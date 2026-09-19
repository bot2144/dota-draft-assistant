import type { AIProvider, AIProviderConfig, AIMessage } from '../types/ai';
import { AIError } from '../types/ai';
import { createProvider } from './AIProviderFactory';
import type { Hero } from '../types/hero';
import type { DraftAnalysis, PickCandidate } from '../types/scoring';
import { buildPickExplanationPrompt } from './prompts/pick_explanation';
import { buildWhatShouldIPickPrompt } from './prompts/what_should_i_pick';
import { buildHeroComparisonPrompt } from './prompts/hero_comparison';
import { buildDraftSummaryPrompt } from './prompts/draft_summary';
import { buildDraftAnalysisPrompt } from './prompts/draft_analysis';
import { formatCandidate } from './prompts/shared';

export interface AIResult {
  text: string;
  usedAI: boolean;
  errorKind?: string;
}

interface CacheEntry {
  text: string;
  ts: number;
}

const IN_MEMORY_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DEBOUNCE_MS = 500;

function fallbackFromCandidate(hero: Hero, candidate: PickCandidate): string {
  const strengths = candidate.strengths.length
    ? candidate.strengths.map((s) => `• ${s}`).join('\n')
    : '• (no standout strengths flagged by the engine)';
  const risks = candidate.risks.length
    ? candidate.risks.map((r) => `• ${r}`).join('\n')
    : '• (no standout risks flagged by the engine)';
  return [
    `${hero.localizedName} — overall score ${candidate.overallScore}/100 (local engine only, AI explanation unavailable)`,
    '',
    'Why:',
    strengths,
    '',
    'Risks:',
    risks,
  ].join('\n');
}

function messagesHash(messages: AIMessage[]): string {
  return messages.map((m) => `${m.role}:${m.content}`).join('|');
}

/**
 * Orchestrates Level-2 (AI explanation) calls on top of Level-1 (analysis
 * engine) data. Never lets an AI failure break the app — every method
 * degrades to a deterministic, data-grounded fallback string instead of
 * throwing, and reports whether AI was actually used so the UI can show
 * an honest indicator.
 */
export class AIService {
  private provider: AIProvider = createProvider({ provider: 'none' });
  private cache = new Map<string, CacheEntry>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  configure(config: AIProviderConfig): void {
    this.provider = createProvider(config);
  }

  isAvailable(): boolean {
    return this.provider.isConfigured();
  }

  currentProviderId(): string {
    return this.provider.id;
  }

  private async runOrFallback(messages: AIMessage[], fallback: string): Promise<AIResult> {
    const key = messagesHash(messages);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.ts < IN_MEMORY_TTL_MS) {
      return { text: cached.text, usedAI: true };
    }

    if (!this.provider.isConfigured()) {
      return { text: fallback, usedAI: false, errorKind: 'no-api-key' };
    }

    try {
      const result = await this.provider.complete({ messages, maxTokens: 600 });
      this.cache.set(key, { text: result.text, ts: Date.now() });
      return { text: result.text, usedAI: true };
    } catch (err) {
      const kind = err instanceof AIError ? err.kind : 'unknown';
      return { text: fallback, usedAI: false, errorKind: kind };
    }
  }

  async explainPick(
    hero: Hero,
    candidate: PickCandidate,
    allyTeam: Hero[],
    enemyTeam: Hero[],
    language: 'en' | 'ru'
  ): Promise<AIResult> {
    const messages = buildPickExplanationPrompt(hero, candidate, allyTeam, enemyTeam, language);
    return this.runOrFallback(messages, fallbackFromCandidate(hero, candidate));
  }

  async whatShouldIPick(
    allyTeam: Hero[],
    enemyTeam: Hero[],
    top: { hero: Hero; candidate: PickCandidate }[],
    analysis: DraftAnalysis,
    language: 'en' | 'ru'
  ): Promise<AIResult> {
    const messages = buildWhatShouldIPickPrompt(allyTeam, enemyTeam, top, analysis, language);
    const fallback = top
      .map(({ hero, candidate }, i) => `#${i + 1} ${hero.localizedName} — ${candidate.overallScore}/100`)
      .join('\n');
    return this.runOrFallback(messages, `Best local-engine ranking (AI explanation unavailable):\n${fallback}`);
  }

  async compareHeroes(
    entries: { hero: Hero; candidate: PickCandidate }[],
    allyTeam: Hero[],
    enemyTeam: Hero[],
    language: 'en' | 'ru'
  ): Promise<AIResult> {
    const messages = buildHeroComparisonPrompt(entries, allyTeam, enemyTeam, language);
    const fallback = entries.map(({ hero, candidate }) => formatCandidate(hero, candidate)).join('\n\n');
    return this.runOrFallback(messages, fallback);
  }

  async summarizeDraft(
    allyTeam: Hero[],
    enemyTeam: Hero[],
    analysis: DraftAnalysis,
    language: 'en' | 'ru'
  ): Promise<AIResult> {
    const messages = buildDraftSummaryPrompt(allyTeam, enemyTeam, analysis, language);
    const issues = analysis.allyIssues.map((i) => `• ${i.message}`).join('\n') || '(no issues detected)';
    return this.runOrFallback(messages, `Draft issues (AI summary unavailable):\n${issues}`);
  }

  async answerQuestion(
    allyTeam: Hero[],
    enemyTeam: Hero[],
    analysis: DraftAnalysis,
    question: string,
    language: 'en' | 'ru'
  ): Promise<AIResult> {
    const messages = buildDraftAnalysisPrompt(allyTeam, enemyTeam, analysis, question, language);
    return this.runOrFallback(
      messages,
      'AI is unavailable right now (no API key or a network/rate-limit error). Configure a provider in Settings to get natural-language answers — local engine data is still driving all scores and recommendations.'
    );
  }

  /**
   * Schedules a debounced call keyed by `key` — used for AI calls that are
   * triggered by fast-changing draft state (e.g. auto-explaining the top
   * pick as heroes are added) so we don't fire a request per click.
   */
  scheduleDebounced(key: string, fn: () => void, delayMs = DEBOUNCE_MS): void {
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.debounceTimers.delete(key);
        fn();
      }, delayMs)
    );
  }
}

export const aiService = new AIService();
