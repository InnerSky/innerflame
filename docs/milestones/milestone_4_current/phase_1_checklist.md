# Phase 1 Checklist: System Prompt for Streaming Document Editor

## Objective
Establish a well-defined system prompt for the Cline-like streaming document editor that instructs the AI to use XML tags for document edits, which will be processed by the frontend to generate visual diffs between the original document and AI-suggested changes.

## Tasks

### Research & Analysis
- [x] Review existing code architecture in `@agent.ts` to understand how system prompts are currently implemented
- [x] Analyze the SSE client implementation to ensure compatibility with the streaming approach
- [x] Study XML tag parsing mechanisms to ensure proper extraction of document edits
- [x] Review diff calculation utilities to understand how they'll work with the streaming content

### System Prompt Development
- [x] Create `documentSystemPrompt.ts` file in the appropriate directory
- [x] Define base system prompt with detailed instructions for AI:
  - [x] Proper XML formatting for document edits using `<document_edit>` and `<content>` tags
  - [x] Guidelines for providing full document content, not just changes
  - [x] Instructions to avoid using unrelated XML tags that might be misinterpreted
  - [x] Guidance on response structure for non-edit interactions
- [x] Develop additional contextual instructions for document-specific interactions
- [x] Include examples of proper formatting for various document editing scenarios
- [x] Define error handling instructions for when the AI cannot complete requested edits

### Integration Planning
- [x] Identify how the system prompt will be integrated with the existing `@agent.ts` file
- [x] Plan for passing document context (id, title, content) to the system prompt
- [x] Define approach for combining the base system prompt with custom user instructions
- [x] Determine how to properly signal document edit capabilities to the frontend

es)
  - [ ] Edge cases (very large documents, empty documents)
- [ ] Develop test harness for validating XML tag usage in AI responses
- [ ] Define metrics for measuring system prompt effectiveness

## Verification Criteria
1. [x] System prompt successfully instructs the AI to use XML tags for document edits
2. [x] XML tags are properly formatted and can be extracted by the frontend
3. [x] System prompt handles different document contexts appropriately
4. [x] AI responses for non-edit interactions follow the defined structure
5. [x] Prompt is compatible with the existing SSE client and stream processing

## Dependencies
- [x] Access to the AI model that will be used for document editing
- [x] Understanding of the document data structure and context
- [x] Knowledge of the frontend components that will consume the streaming response
- [x] Familiarity with the existing SSE client implementation

## Notes
- The system prompt is the foundation for the entire streaming document editor, so its design should be carefully considered
- The prompt should be flexible enough to accommodate different document types and editing scenarios
- XML tag structure should be consistent and easily parseable by the frontend
- Integration with the agent is done by using the `getSystemPromptForContext` function that selects the appropriate prompt based on context type 