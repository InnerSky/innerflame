# LLM Provider Abstraction

This module provides a flexible abstraction layer for LLM providers, allowing the application to use different LLM services with minimal changes.

## Architecture

The LLM provider abstraction consists of the following components:

1. **Interface**: Defines the contract that all LLM providers must implement
2. **Providers**: Concrete implementations for specific LLM services (currently Anthropic/Claude)
3. **Factory**: Functions to create and initialize provider instances
4. **Adapter**: Connects the provider interface with the agent's message format

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
2. Create a new provider implementation in a subdirectory of `providers/`
3. Implement the `LLMProvider` interface for the new provider
4. Update the `createLLMProvider` and `initializeProviderFromEnv` functions in `factory.ts`

## Providers

### Anthropic (Claude)

The Anthropic provider uses the official `@anthropic-ai/sdk` to interact with Claude. It supports:

- Regular message sending
- Streaming responses
- System prompts
- Error handling

## Adapter

The adapter converts between the agent's message format and the LLM provider's message format. It provides:

- Message format conversion
- Common interface for agent interactions
- Stream handling 