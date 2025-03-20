# InnerFlame API Service

This is the backend service for InnerFlame, providing tRPC API endpoints and AI assistant functionality.

## Features

- **tRPC API**: Type-safe API endpoints for frontend communication
- **Claude Integration**: Integration with Anthropic's Claude API
- **Agent Implementation**: Simple agent implementation for document interaction
- **Tool Support**: Framework for adding and executing tools

## Getting Started

### Prerequisites

- Node.js 18+
- NPM
- Claude API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example` and add your API keys:
```
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-haiku-20240307  # Set to your preferred Claude model
CLAUDE_MAX_TOKENS=1024                # Maximum tokens for completion
```

### Development

Start the development server:
```bash
npm run dev
```

The server will start at http://localhost:3001.

### Testing

Test the agent using the CLI tool:
```bash
npm run test-cli
```

This will start an interactive session where you can chat with the agent.

## Project Structure

- `src/index.ts` - Main application entry point
- `src/routes/` - tRPC router definitions
- `src/services/` - Business logic and service implementations
  - `src/services/ai/` - AI agent implementation
- `src/tools/` - CLI tools and utilities

## API Endpoints

- `/health` - Health check endpoint
- `/trpc` - tRPC API endpoint

## Agent Implementation

The agent is implemented in `src/services/ai/agent.ts` and supports:

1. Processing user messages
2. Generating responses using Claude
3. Executing tools when requested
4. Providing tool results back to the user

## Available Tools

Currently, the agent supports the following tools:

- `updateDocument` - Update document content

To use a tool, instruct the agent with explicit commands, for example:
"Please update this document with the following content: ..."

## Adding New Tools

New tools can be added in the `packages/ai-tools/src/tools/` directory following the pattern in `documentUpdate.ts`.

Each tool requires:

1. A schema defining its parameters
2. A handler function to execute the tool
3. Registration with the agent

## Deployment

Build the production version:
```bash
npm run build
```

The built files will be in the `dist/` directory.

Run the production server:
```bash
npm run start
```