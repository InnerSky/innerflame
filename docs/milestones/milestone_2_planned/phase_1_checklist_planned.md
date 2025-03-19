# Phase 1 Checklist: Backend Service with Basic LangGraph Agent

## Objective
Set up the foundational backend service with Claude API integration and implement a minimal LangGraph agent that can be tested both via CLI and optionally with the existing ChatInterface.

## Tasks

### Environment Setup
- [ ] Create Node.js service structure in apps/api directory
  - [ ] Set up package.json with ESM configuration
  - [ ] Configure TypeScript with tsconfig.json for ESM compatibility
  - [ ] Set up dev dependencies (nodemon, ts-node, etc.)
  - [ ] Configure environment variables loading (dotenv)

### Claude API Integration
- [ ] Create Claude API client module
  - [ ] Implement secure API key management
  - [ ] Set up connection with Anthropic's Claude API
  - [ ] Create types for Claude API requests and responses
  - [ ] Implement error handling for API calls
  - [ ] Create a basic message function for testing

### LangGraph Minimal Implementation
- [ ] Set up LangGraph.js dependencies
  - [ ] Create a simple agent state interface
  - [ ] Set up a basic state management system
  - [ ] Implement a minimal prompt template system
- [ ] Create a simple LangGraph agent
  - [ ] Define a basic agent workflow with single-step processing
  - [ ] Integrate Claude API for message generation
  - [ ] Set up a simple system prompt for message context
  - [ ] Create a basic tool definition schema
  - [ ] Implement a simple document update tool

### tRPC Setup
- [ ] Set up tRPC router and server
  - [ ] Configure tRPC with Express adapter
  - [ ] Implement CORS configuration
  - [ ] Set up authentication middleware with Supabase
  - [ ] Create a basic health check procedure
  - [ ] Implement a message endpoint that invokes the LangGraph agent

### Testing & Validation
- [ ] Create a CLI testing tool
  - [ ] Implement a simple command-line interface for agent interaction
  - [ ] Add logging of all agent steps and state transitions
  - [ ] Create test scenarios for validating agent responses
  - [ ] Add ability to simulate document context
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
- [ ] Create development server script
  - [ ] Configure hot reloading for development
  - [ ] Set up logging for development debugging
  - [ ] Create a .env.example file with required variables
  - [ ] Document local development process

## Verification Criteria
1. The backend service starts without errors
2. CLI tool can successfully communicate with the LangGraph agent
3. LangGraph agent correctly processes messages and returns contextual responses
4. Basic tool execution works with sample document data
5. tRPC endpoints can be called from a test client
6. All tests pass in the testing framework
7. (Optional) ChatInterface can be manually tested with the agent

## Dependencies
- Node.js 18+
- TypeScript 5+
- tRPC
- Anthropic Claude API access
- LangGraph.js
- Supabase Auth for authentication

## Notes
- Keep the LangGraph implementation minimal but functional
- Focus on a single tool example (document update) for the initial implementation
- Ensure all code follows ESM standards with .js extensions in imports
- Create detailed logs to trace agent execution for easier debugging
- Document all environment variables required
- Consider temporary simplifications to make testing easier 