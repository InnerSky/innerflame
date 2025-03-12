# Contributing to InnerFlame

Thank you for your interest in contributing to InnerFlame! This document provides guidelines and instructions for contributing to this project.

## Development Workflow

1. **Fork the repository** (external contributors)
2. **Create a branch** for your feature or bugfix
   ```
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the coding standards
4. **Write tests** for your changes
5. **Run linting and tests** to ensure code quality
   ```
   npm run lint
   npm test
   ```
6. **Commit your changes** using conventional commit messages
   ```
   feat: add new feature
   fix: resolve issue with X
   docs: update documentation
   ```
7. **Create a pull request** with a clear description of your changes

## Monorepo Structure

This project uses a monorepo structure managed by Turborepo. When adding new code:

- **Common types** should go in `packages/shared-types`
- **Shared UI components** should go in `packages/ui-components`
- **Database logic** should go in `packages/database`
- **Application-specific code** should go in the appropriate app directory

## Environment Variables

Each application may require specific environment variables. These should be documented in an `.env.example` file in each application directory.

For local development, you can create a `.env.local` file in each application directory.

## Code Style Guide

- Use TypeScript for all new code
- Follow the ESLint configuration
- Write meaningful comments and documentation
- Include JSDoc comments for all exported functions and types
- Use named exports instead of default exports when possible

## Testing Guidelines

- Write unit tests for all new functionality
- Maintain high test coverage for critical code paths
- Mock external dependencies in tests
- Test edge cases and error handling

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation as necessary
3. Include tests for new functionality
4. Make sure all tests pass
5. Get your pull request reviewed by at least one maintainer
6. Once approved, your changes will be merged

## Getting Help

If you have questions or need help with contributing, please open an issue in the repository.

Thank you for contributing to InnerFlame!
