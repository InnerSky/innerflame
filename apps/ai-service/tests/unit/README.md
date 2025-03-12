# AI Service Unit Tests

This directory contains unit tests for the InnerFlame AI WebSocket service.

## Test Structure

Tests are organized to match the structure of the `/src` directory:

- `/websocket` - Tests for WebSocket server and connection handling
- `/agents` - Tests for AI agent implementation
- `/models` - Tests for data models
- `/tools` - Tests for agent tools

## Running Tests

```bash
# From the AI service directory
cd apps/ai-service
npm test

# Run only unit tests
npm run test:unit
```

## Test Guidelines

1. Each module should have a corresponding test file
2. Use Jest for testing
3. Mock external services (Claude API, Firestore)
4. Test WebSocket message handling and session management
