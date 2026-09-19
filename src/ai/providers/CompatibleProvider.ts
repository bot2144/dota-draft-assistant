import type { AICompletionRequest, AICompletionResult, AIProvider, AIProviderConfig } from '../../types/ai';
import { AIError } from '../../types/ai';
import { httpPostJson, HttpError } from '../httpClient';

interface OpenAICompatibleResponse {
  choices: { message: { content: string } }[];
}

/**
 * Generic OpenAI-compatible chat-completions endpoint — for local model
 * servers (LM Studio, Ollama's OpenAI-compat mode, vLLM, etc.) or any
 * third-party proxy the user points us at via Settings → Data Source.
 */
export class CompatibleProvider implements AIProvider {
  readonly id = 'compatible' as const;
  private config: AIProviderConfig;
  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.baseUrl;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    if (!this.isConfigured()) {
      throw new AIError('no-api-key', 'No compatible endpoint URL configured.');
    }
    const url = this.config.baseUrl!.replace(/\/+$/, '') + '/chat/completions';
    try {
      const res = await httpPostJson<OpenAICompatibleResponse>({
        url,
        headers: this.config.apiKey ? { authorization: `Bearer ${this.config.apiKey}` } : {},
        body: {
          model: this.config.model || 'default',
          temperature: req.temperature ?? 0.4,
          max_tokens: req.maxTokens ?? 1024,
          messages: req.messages,
        },
      });
      const text = res.choices?.[0]?.message?.content ?? '';
      if (!text) throw new AIError('invalid-response', 'Compatible endpoint returned no content.');
      return { text, provider: 'compatible', model: this.config.model };
    } catch (err) {
      throw mapError(err);
    }
  }
}

function mapError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  if (err instanceof HttpError) {
    if (err.status === 401 || err.status === 403) return new AIError('no-api-key', 'Endpoint rejected the request (auth).');
    if (err.status === 429) return new AIError('rate-limit', 'Rate limit reached.');
    return new AIError('network', `Request failed (HTTP ${err.status}).`);
  }
  return new AIError('network', 'Could not reach the configured endpoint (network error).');
}
