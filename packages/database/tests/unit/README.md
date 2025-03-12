# Database Package Unit Tests

This directory contains unit tests for the InnerFlame database package.

## Test Structure

Tests follow the structure of the `/src` directory:

- `/repositories` - Tests for data access repositories
- `/utils` - Tests for database utilities

## Running Tests

```bash
# From the database package directory
cd packages/database
npm test
```

## Test Guidelines

1. Mock Supabase client for all tests
2. Test repository methods and error handling
3. Validate data transformations
4. Test connection handling and retry logic
