import { LLMProvider } from './interfaces/LLMProvider.js';
import { createAnthropicAdapter } from './providers/anthropic/AnthropicAdapter.js';
import { ApiHandler } from '../api/index.js';
import { withLogging } from '../api/logging.js';

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
  console.log(`[API Factory] Creating LLM Provider of type: ${config.type}`);
  
  let provider: LLMProvider;
  
  switch (config.type) {
    case ProviderType.ANTHROPIC:
      provider = createAnthropicAdapter(config.apiKey, {
        defaultModel: config.defaultModel,
        defaultMaxTokens: config.defaultMaxTokens
      });
      break;
    
    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
  
  console.log('[API Factory] LLM Provider created, wrapping with logging');
  
  // For ApiHandler compatibility - this is just for type casting as the interfaces are compatible
  if ((provider as unknown as ApiHandler).createMessage && (provider as unknown as ApiHandler).getModel) {
    const apiHandler = provider as unknown as ApiHandler;
    const wrappedHandler = withLogging(apiHandler);
    return wrappedHandler as unknown as LLMProvider;
  }
  
  return provider;
}

/**
 * Initialize an LLM provider from environment variables
 */
export function initializeProviderFromEnv(): LLMProvider {
  console.log('[API Factory] Initializing provider from environment variables');
  const providerType = process.env.LLM_PROVIDER || ProviderType.ANTHROPIC;
  
  // Ensure we have the correct API key for the provider
  switch (providerType) {
    case ProviderType.ANTHROPIC:
      const apiKey = process.env.CLAUDE_API_KEY;
      const model = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';
      const maxTokens = process.env.CLAUDE_MAX_TOKENS 
        ? parseInt(process.env.CLAUDE_MAX_TOKENS, 10) 
        : 1024;
      
      if (!apiKey) {
        throw new Error('CLAUDE_API_KEY environment variable is not set');
      }
      
      console.log(`[API Factory] Initializing Anthropic provider with model: ${model}`);
      
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