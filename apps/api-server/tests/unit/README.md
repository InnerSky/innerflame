# API Server Unit Tests

This directory contains unit tests for the InnerFlame API server.

## Test Structure

Tests are organized to match the structure of the `/src` directory:

- `/controllers` - Tests for API endpoint controllers
- `/services` - Tests for business logic services
- `/middleware` - Tests for Express middleware

## Running Tests

```bash
# From the API server directory
cd apps/api-server
npm test

# Run only unit tests
npm run test:unit
```

## Test Guidelines

1. Each module should have a corresponding test file
2. Use Jest for testing
3. Mock external dependencies (database, authentication)
4. Focus on testing business logic and error handling
