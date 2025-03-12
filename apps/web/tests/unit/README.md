# Web App Unit Tests

This directory contains unit tests for the InnerFlame web application.

## Test Structure

Tests are organized to match the structure of the `/src` directory:

- `/components` - Tests for React components
- `/hooks` - Tests for custom React hooks
- `/features` - Tests for feature modules

## Running Tests

```bash
# From the web app directory
cd apps/web
npm test

# Run only unit tests
npm run test:unit
```

## Test Guidelines

1. Each component/hook/utility should have a corresponding test file
2. Use React Testing Library for component tests
3. Aim for high coverage of business logic
4. Mock external dependencies and API calls
