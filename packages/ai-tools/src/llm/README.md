# LLM Provider Abstraction

This module provides a flexible abstraction layer for LLM providers, allowing the application to use different LLM services with minimal changes.

## Architecture

The LLM provider abstraction consists of the following components:

1. **Interface**: Defines the contract that all LLM providers must implement
2. **Providers**: Concrete implementations for specific LLM services
3. **Adapters**: Bridge between our interfaces and underlying provider implementations
4. **Factory**: Functions to create and initialize provider instances
5. **Handler**: Low-level API clients that perform the actual API calls

## Usage

### Basic Usage

```typescript
import { 
  initializeProviderFromEnv, 
  createLLMAdapter 
} from '@innerflame/ai-tools/src/llm';

// Initialize provider from environment variables
const provider = initializeProviderFromEnv();

// Create adapter
const adapter = createLLMAdapter(provider);

// Send a message
const response = await adapter.sendMessage(messages, {
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7
});

// Stream a message
const stream = await adapter.streamMessage(messages, {
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7
});
```

### Environment Variables

The provider factory uses the following environment variables:

- `LLM_PROVIDER`: The provider type to use (default: `'anthropic'`)
- `CLAUDE_API_KEY`: The API key for Anthropic's Claude API
- `CLAUDE_MODEL`: The model to use (default: `'claude-3-haiku-20240307'`)
- `CLAUDE_MAX_TOKENS`: Maximum tokens for completion (default: `1024`)

## Adding New Providers

To add a new LLM provider:

1. Add the provider type to `ProviderType` enum in `factory.ts`
2. Create a new provider implementation or adapter in a subdirectory of `providers/`
3. Implement the `LLMProvider` interface
4. Update the `createLLMProvider` and `initializeProviderFromEnv` functions in `factory.ts`

## Providers

### Anthropic (Claude)

The Anthropic implementation consists of two layers:

1. **AnthropicAdapter**: Implements the `LLMProvider` interface and provides a high-level API
2. **AnthropicHandler**: Low-level handler that makes direct API calls to Claude

The Anthropic adapter supports:

- Regular message sending
- Streaming responses
- System prompts
- Error handling with automatic retries
- Detailed token usage tracking
- Extended features:
  - Claude 3.5 and 3.7 models
  - Extended thinking/reasoning (Claude 3.7+)
  - Prompt caching for improved performance (Claude 3.5+)

#### Advanced Usage

To use advanced features like thinking and caching:

```typescript
import { 
  createAnthropicAdapter,
  AnthropicRequestOptions
} from '@innerflame/ai-tools/src/llm/providers/anthropic/AnthropicAdapter';

// Create adapter with caching enabled
const adapter = createAnthropicAdapter(apiKey, {
  defaultModel: 'claude-3-sonnet-20240229',
  enableCaching: true
});

// Use extended thinking with Claude 3.7
const options: AnthropicRequestOptions = {
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7,
  enableThinking: true,
  thinkingBudget: 1500 // Allocate 1500 tokens for thinking
};

const response = await adapter.sendMessage(messages, options);

// Access the reasoning
if (response.reasoning) {
  console.log('Reasoning:', response.reasoning);
}

// Check detailed token usage
console.log('Token usage:', response.detailedUsage);
```

## Adapter

The adapter converts between the agent's message format and the LLM provider's message format. It provides:

- Message format conversion
- Common interface for agent interactions
- Stream handling
- Provider-specific feature access 