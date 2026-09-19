import type { AICompletionRequest, AICompletionResult, AIProvider, AIProviderConfig } from '../../types/ai';
import { AIError } from '../../types/ai';
import { httpPostJson, HttpError } from '../httpClient';

const DEFAULT_MODEL = 'gpt-4o-mini';

interface OpenAIChatResponse {
  choices: { message: { content: string } }[];
}

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai' as const;
  private config: AIProviderConfig;
  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    if (!this.isConfigured()) {
      throw new AIError('no-api-key', 'No OpenAI API key configured.');
    }
    try {
      const res = await httpPostJson<OpenAIChatResponse>({
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { authorization: `Bearer ${this.config.apiKey}` },
        body: {
          model: this.config.model || DEFAULT_MODEL,
          temperature: req.temperature ?? 0.4,
          max_tokens: req.maxTokens ?? 1024,
          messages: req.messages,
        },
      });
      const text = res.choices?.[0]?.message?.content ?? '';
      if (!text) throw new AIError('invalid-response', 'OpenAI returned no content.');
      return { text, provider: 'openai', model: this.config.model || DEFAULT_MODEL };
    } catch (err) {
      throw mapError(err);
    }
  }
}

function mapError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  if (err instanceof HttpError) {
    if (err.status === 401 || err.status === 403) return new AIError('no-api-key', 'OpenAI rejected the API key.');
    if (err.status === 429) return new AIError('rate-limit', 'OpenAI rate limit reached.');
    return new AIError('network', `OpenAI request failed (HTTP ${err.status}).`);
  }
  return new AIError('network', 'Could not reach OpenAI (network error).');
}
