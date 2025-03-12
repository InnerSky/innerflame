# InnerFlame

InnerFlame is a full-stack application that helps users organize their thoughts, ideas, and notes with AI assistance.

## Project Structure

This is a monorepo containing multiple applications and shared packages:

```
/innerflame
  /apps
    /web            - React web application
    /mobile         - React Native mobile app (future)
    /admin-portal   - Admin dashboard (future)
    /api-server     - REST API server
    /ai-service     - WebSocket AI service
    /analytics      - Analytics service (future)
  /packages
    /shared-types   - TypeScript types shared across all apps
    /ui-components  - Shared React components
    /database       - Database access layer
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Running the Applications

To run all applications in development mode:

```
npm run dev
```

To run a specific application:

```
cd apps/web
npm run dev

# or
cd apps/api-server
npm run dev
```

### Building

To build all applications:

```
npm run build
```

To build a specific application:

```
cd apps/web
npm run build
```

## Testing

Each package and application contains its own test folder with unit, integration, and end-to-end tests where applicable.

```
npm run test        # Run all tests
npm run test:unit   # Run only unit tests
```

## Contributing

Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for guidelines on contributing to this project.

## License

This project is proprietary and confidential.
