import type { AIProvider, AIProviderConfig } from '../types/ai';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { CompatibleProvider } from './providers/CompatibleProvider';
import { NullProvider } from './providers/NullProvider';

export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'compatible':
      return new CompatibleProvider(config);
    default:
      return new NullProvider();
  }
}
