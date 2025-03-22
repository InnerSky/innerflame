import { LLMProvider } from './interfaces/LLMProvider.js';
import { AnthropicProvider, createAnthropicProvider } from './providers/anthropic/AnthropicProvider.js';

// Provider types
export enum ProviderType {
  ANTHROPIC = 'anthropic',
  // Add other providers here as they are implemented
}

// Provider configuration
export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  defaultModel?: string;
  defaultMaxTokens?: number;
}

/**
 * Create an LLM provider based on the configuration
 */
export function createLLMProvider(config: ProviderConfig): LLMProvider {
  switch (config.type) {
    case ProviderType.ANTHROPIC:
      return createAnthropicProvider(config.apiKey, {
        defaultModel: config.defaultModel,
        defaultMaxTokens: config.defaultMaxTokens
      });
    
    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}

/**
 * Initialize an LLM provider from environment variables
 */
export function initializeProviderFromEnv(): LLMProvider {
  const providerType = process.env.LLM_PROVIDER || ProviderType.ANTHROPIC;
  
  // Ensure we have the correct API key for the provider
  switch (providerType) {
    case ProviderType.ANTHROPIC:
      const apiKey = process.env.CLAUDE_API_KEY;
      const model = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';
      const maxTokens = process.env.CLAUDE_MAX_TOKENS 
        ? parseInt(process.env.CLAUDE_MAX_TOKENS, 10) 
        : 1024;
      
      if (!apiKey) {
        throw new Error('CLAUDE_API_KEY environment variable is not set');
      }
      
      console.log(`Initializing Anthropic provider with model: ${model}`);
      
      return createLLMProvider({
        type: ProviderType.ANTHROPIC,
        apiKey,
        defaultModel: model,
        defaultMaxTokens: maxTokens
      });
    
    default:
      throw new Error(`Unsupported provider type: ${providerType}`);
  }
} 