# UI Components Unit Tests

This directory contains unit tests for the InnerFlame UI components package.

## Test Structure

Tests follow the structure of the `/src` directory:

- `/base` - Tests for base UI components
- `/composed` - Tests for composed UI components 
- `/ai` - Tests for AI-specific UI components

## Running Tests

```bash
# From the UI components directory
cd packages/ui-components
npm test
```

## Test Guidelines

1. Test component rendering and props
2. Verify component interactions and events
3. Test accessibility compliance
4. Use React Testing Library for component testing
5. Include snapshot tests for UI stability
