export type AIProviderId = 'anthropic' | 'openai' | 'compatible' | 'none';

export interface AIProviderConfig {
  provider: AIProviderId;
  apiKey?: string;
  /** For "compatible" (any OpenAI-compatible endpoint, e.g. local LLM server). */
  baseUrl?: string;
  model?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  text: string;
  provider: AIProviderId;
  model?: string;
}

export type AIErrorKind =
  | 'no-api-key'
  | 'network'
  | 'rate-limit'
  | 'invalid-response'
  | 'unknown';

export class AIError extends Error {
  kind: AIErrorKind;
  constructor(kind: AIErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'AIError';
  }
}

/** Provider-agnostic interface. Every concrete provider implements this. */
export interface AIProvider {
  readonly id: AIProviderId;
  isConfigured(): boolean;
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
}
