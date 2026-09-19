import type { AICompletionRequest, AICompletionResult, AIProvider } from '../../types/ai';
import { AIError } from '../../types/ai';

/** Used when no AI provider is configured. Always fails cleanly with a typed error. */
export class NullProvider implements AIProvider {
  readonly id = 'none' as const;
  isConfigured(): boolean {
    return false;
  }
  async complete(_req: AICompletionRequest): Promise<AICompletionResult> {
    throw new AIError('no-api-key', 'No AI provider configured.');
  }
}
