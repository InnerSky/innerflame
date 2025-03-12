# Shared Types Unit Tests

This directory contains unit tests for the InnerFlame shared types package.

## Test Structure

Tests follow the structure of the `/src` directory:

- `entities.test.ts` - Tests for entity type validation
- `websocket.test.ts` - Tests for WebSocket message type validation
- `ai.test.ts` - Tests for AI-related type validation

## Running Tests

```bash
# From the shared-types directory
cd packages/shared-types
npm test
```

## Test Guidelines

1. Focus on type validation and schema verification
2. Test edge cases and optional properties
3. Ensure type compatibility with database schemas
