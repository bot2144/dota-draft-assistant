import type { AICompletionRequest, AICompletionResult, AIProvider, AIProviderConfig } from '../../types/ai';
import { AIError } from '../../types/ai';
import { httpPostJson, HttpError } from '../httpClient';

const DEFAULT_MODEL = 'claude-sonnet-5';

interface AnthropicResponse {
  content: { type: string; text?: string }[];
}

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic' as const;
  private config: AIProviderConfig;
  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    if (!this.isConfigured()) {
      throw new AIError('no-api-key', 'No Anthropic API key configured.');
    }
    const system = req.messages.find((m) => m.role === 'system')?.content;
    const rest = req.messages.filter((m) => m.role !== 'system');

    try {
      const res = await httpPostJson<AnthropicResponse>({
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: {
          model: this.config.model || DEFAULT_MODEL,
          max_tokens: req.maxTokens ?? 1024,
          temperature: req.temperature ?? 0.4,
          system,
          messages: rest.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      const text = res.content?.find((c) => c.type === 'text')?.text ?? '';
      if (!text) throw new AIError('invalid-response', 'Anthropic returned no text content.');
      return { text, provider: 'anthropic', model: this.config.model || DEFAULT_MODEL };
    } catch (err) {
      throw mapError(err);
    }
  }
}

function mapError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  if (err instanceof HttpError) {
    if (err.status === 401 || err.status === 403) return new AIError('no-api-key', 'Anthropic rejected the API key.');
    if (err.status === 429) return new AIError('rate-limit', 'Anthropic rate limit reached.');
    return new AIError('network', `Anthropic request failed (HTTP ${err.status}).`);
  }
  return new AIError('network', 'Could not reach Anthropic (network error).');
}
