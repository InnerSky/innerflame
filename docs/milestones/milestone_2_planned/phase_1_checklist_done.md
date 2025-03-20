# Phase 1 Checklist: Backend Service with Basic LangGraph Agent

## Objective
Set up the foundational backend service with Claude API integration and implement a minimal LangGraph agent that can be tested both via CLI and optionally with the existing ChatInterface.

## Tasks

### Environment Setup
- [x] Create Node.js service structure in apps/api directory
- [x] Set up package.json with ESM configuration
- [x] Configure TypeScript with tsconfig.json for ESM compatibility
- [x] Set up dev dependencies (nodemon, ts-node, etc.)
- [x] Configure environment variables loading (dotenv)

### Claude API Integration
- [x] Create Claude API client module
- [x] Implement secure API key management
- [x] Set up connection with Anthropic's Claude API
- [x] Create types for Claude API requests and responses
- [x] Implement error handling for API calls
- [x] Create a basic message function for testing

### LangGraph Minimal Implementation
- [x] Set up LangGraph.js dependencies
- [x] Create a simple agent state interface
- [x] Set up a basic state management system
- [x] Implement a minimal prompt template system
- [x] Create a simple LangGraph agent
  - [x] Define a basic agent workflow with single-step processing
  - [x] Integrate Claude API for message generation
  - [x] Set up a simple system prompt for message context
  - [x] Create a basic tool definition schema
  - [x] Implement a simple document update tool

### tRPC Setup
- [x] Set up tRPC router and server
- [x] Configure tRPC with Express adapter
- [x] Implement CORS configuration
- [x] Set up authentication middleware with Supabase
- [x] Create a basic health check procedure
- [x] Implement a message endpoint that invokes the LangGraph agent

### Testing & Validation
- [x] Create a CLI testing tool
  - [x] Implement a simple command-line interface for agent interaction
  - [x] Add logging of all agent steps and state transitions
  - [x] Create test scenarios for validating agent responses
  - [x] Add ability to simulate document context
- [ ] Set up unit testing framework
  - [ ] Configure Jest or Vitest for the API
  - [ ] Create mocks for Claude API responses
  - [ ] Implement basic tests for client functions
  - [ ] Set up testing scripts in package.json
- [ ] (Optional) Create simple ChatInterface integration test
  - [ ] Implement a temporary connector to the existing ChatInterface.tsx
  - [ ] Set up a development environment for cross-testing
  - [ ] Document the test setup process

### Local Development Environment
- [x] Create development server script
- [x] Configure hot reloading for development
- [x] Set up logging for development debugging
- [x] Create a .env.example file with required variables
- [x] Document local development process

## Verification Criteria
1. [x] The backend service starts without errors
2. [x] CLI tool can successfully communicate with the LangGraph agent
3. [x] LangGraph agent correctly processes messages and returns contextual responses
4. [x] Basic tool execution works with sample document data
5. [x] tRPC endpoints can be called from a test client
6. [ ] All tests pass in the testing framework
7. [ ] (Optional) ChatInterface can be manually tested with the agent

## Dependencies
- [x] Node.js 18+
- [x] TypeScript 5+
- [x] tRPC
- [x] Anthropic Claude API access
- [x] LangGraph.js
- [x] Supabase Auth for authentication

## Notes
- [x] Added environment variables for configuring Claude model settings (CLAUDE_MODEL, CLAUDE_MAX_TOKENS)
- [x] Simplified the agent implementation while maintaining tool functionality
- [x] Created comprehensive README documentation