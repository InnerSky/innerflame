# Phase 4: LLM Provider Abstraction Checklist

**Goal**: Create a minimal abstraction layer for LLM providers to make it easier to switch between different providers (Claude, OpenAI, etc.) while maintaining current functionality.

## Understanding Current Implementation

- [x] Examine `packages/ai-tools/src/claude/client.ts` to understand the current Claude client implementation
- [x] Review `apps/api/src/services/ai/agent.ts` to see how the agent interacts with the Claude client
- [x] Analyze `apps/api/src/routes/ai.ts` to understand how the agent is initialized and used
- [x] Document the key functionality that must be preserved in the abstraction
- [x] Review existing streaming implementation and identify critical behaviors

## Key Functionality to Preserve

- [x] List essential message sending capabilities
  - Regular message sending (`sendMessage`): Takes an array of messages and returns a complete response
  - Streaming message sending (`createStreamingMessage`): Takes messages and returns a ReadableStream
  - Error handling with custom ClaudeApiError class
  - Message format conversion between agent and provider formats

- [x] Document the streaming behavior and requirements
  - Returns a ReadableStream that can be processed with a reader
  - Uses TextDecoder to handle chunks
  - Processes event data by parsing JSON from the stream
  - Sends tokens to the client via SSE as they arrive
  - Accumulates the full response for further processing

- [x] Capture the tool calling implementation details
  - Custom tool call format using `{{tool_name: args}}` pattern
  - Regex parsing to detect and extract tool calls
  - Tool execution with context
  - Tool result handling and sending via SSE

- [x] Note error handling patterns
  - Custom error class with additional information
  - Try/catch blocks for API calls and processing
  - Error propagation to the client

- [x] Document any Claude-specific behaviors that might be different with other providers
  - Claude API url and versioning
  - Message format and role mapping
  - System prompt handling
  - Stream format and event structure

## Implementing LLM Provider Abstraction

- [x] Create LLM provider interface in `packages/ai-tools/src/llm/interfaces/LLMProvider.ts`
- [x] Implement Anthropic provider using the official SDK in `packages/ai-tools/src/llm/providers/anthropic/`
- [x] Create a simple provider factory in `packages/ai-tools/src/llm/factory.ts`
- [x] Modify agent code to use the provider interface instead of direct client calls
- [x] Update environment variable handling to support provider configuration

## Testing and Verification

- [x] Test basic message sending with the new abstraction
- [x] Verify streaming functionality works as expected
- [x] Test tool calling behavior remains consistent
- [x] Ensure error handling works properly
- [x] Create documentation for the new abstraction layer

## Completion Criteria

- [x] All tests pass
- [x] Existing functionality is preserved
- [x] Code is cleaner and more maintainable
- [x] Documentation is updated to reflect the new architecture 