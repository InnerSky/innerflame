# Technical Blueprint

**Version:** 1.1
**Date:** 2023-10-27

## Table of Contents

*   [Introduction](#introduction)
*   [Project Structure](#project-structure)
*   [Technology Stack](#technology-stack)
*   [Data Schema](#data-schema)
*   [API Endpoints](#api-endpoints)
*   [Component Library](#component-library)
*   [Utility Functions](#utility-functions)
*   [State Management](#state-management)
*   [Authentication Flow](#authentication-flow)
*   [External Services](#external-services)
*   [Design Patterns](#design-patterns)
*   [Features](#features)

## Introduction

This document serves as the comprehensive, single source of truth for all technical aspects of the InnerFlame project. It should be consulted before implementing any new feature or making technical decisions to ensure consistency and adherence to the DRY principle.

## Project Structure

InnerFlame follows a monorepo structure to house both frontend and backend components, enabling code sharing and type safety across the application.

```
innerflame/
├── .github/                # GitHub workflows and templates
├── .husky/                 # Git hooks for pre-commit linting
├── .netlify/               # Netlify deployment configuration
├── apps/
│   ├── web/                # Frontend React application
│   │   ├── public/         # Static assets
│   │   ├── src/            # Application source code
│   │   │   ├── components/ # UI components specific to web app
│   │   │   ├── contexts/   # React context providers
│   │   │   ├── features/   # Feature-specific code (e.g., onboarding, entity editing)
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── lib/        # Client libraries
│   │   │   ├── pages/      # Route components
│   │   │   ├── types/      # Type definitions
│   │   │   ├── utils/      # Utility functions
│   │   │   ├── App.tsx     # Root component
│   │   │   └── main.tsx    # Application entry point
│   │   ├── index.html      # HTML entry point
│   │   ├── package.json    # Dependencies and scripts
│   │   ├── tailwind.config.js # Tailwind CSS configuration
│   │   ├── tsconfig.json   # TypeScript configuration
│   │   └── vite.config.ts  # Vite bundler configuration
│   │
│   └── api/                # Backend API service
│       ├── src/
│       │   ├── controllers/ # (Optional structure for request handling)
│       │   ├── routers/     # tRPC routers defining API endpoints
│       │   ├── services/    # Business logic (e.g., questionnaire service, AI service)
│       │   │   └── ai/     # AI agent implementation
│       │   │       └── agent.ts  # Custom agentic framework implementation
│       │   ├── utils/      # Backend utilities
│       │   └── index.ts    # API server entry point
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── types/              # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── entities.ts # Core entity types
│   │   │   ├── message.ts  # Message-related types
│   │   │   ├── questionnaire.ts # Questionnaire structure/response types
│   │   │   └── index.ts
│   │   └── package.json
│   ├── ui/                 # Shared UI components (built with Radix/Tailwind)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/              # Shared utilities
│   │   ├── src/
│   │   │   ├── supabase.ts # Supabase client utilities
│   │   │   └── index.ts
│   │   └── package.json
│   └── ai-tools/           # Shared AI tools implementation
│       ├── src/
│       │   ├── tools/      # Tool implementations for AI agents
│       │   │   ├── entityUpdate.ts  # Entity modification tool
│       │   │   └── askUserQuestion.ts # Interactive question tool
│       │   ├── langgraph/  # Type definitions for agent interfaces
│       │   │   └── types.ts # Shared types for agent implementation
│       │   ├── api/        # Low-level API clients and handlers
│       │   │   ├── providers/ # Provider implementations
│       │   │   │   ├── anthropic.ts # AnthropicHandler implementation
│       │   │   │   └── other providers
│       │   │   └── retry-fixed.ts # Retry utility with ESM/TS compatibility
│       │   ├── llm/        # LLM provider abstraction layer
│       │   │   ├── interfaces/  # Provider interfaces and types
│       │   │   ├── providers/   # Concrete provider implementations
│       │   │   │   └── anthropic/ # Anthropic/Claude implementation
│       │   │   │       ├── AnthropicAdapter.ts # Adapter implementation
│       │   │   │       └── __tests__/ # Unit and integration tests
│       │   │   ├── adapter.ts   # Adapts message formats between agent and provider
│       │   │   ├── factory.ts   # Provider creation and initialization
│       │   │   └── index.ts     # Public exports
│       │   └── index.ts
│       └── package.json
├── supabase/               # Supabase configuration and migrations
├── docs/                   # Project documentation
│   ├── milestones/         # Project milestone tracking
│   ├── technical_blueprint.md  # This document
│   └── questionnaire_system.md # Detailed Questionnaire System Doc (Separate or Linked)
├── netlify.toml            # Netlify deployment configuration
├── package.json            # Root package.json with workspaces
├── tsconfig.json           # Base TypeScript configuration
├── turbo.json              # Turborepo configuration
└── eslint.config.js        # ESLint configuration
```

### Configuration Overview

#### Root Configuration

*   `package.json`: Defines workspaces and shared dependencies
*   `tsconfig.json`: Base TypeScript configuration with path aliases for packages
*   `turbo.json`: Defines the build pipeline and task dependencies
*   `eslint.config.js`: Unified ESLint configuration for code quality
*   `.prettierrc.json`: Formatting standards
*   `netlify.toml`: Deployment configuration for the web application

#### Web Application Configuration

*   `apps/web/vite.config.ts`: Sets up build tools, plugins, and path aliases
*   `apps/web/tsconfig.json`: Extends root configuration with web-specific settings
*   `apps/web/tailwind.config.js`: Styling configuration for the web app

#### Package Configuration

Each package in the `packages/` directory has its own:

*   `package.json`: Defines dependencies and build scripts
*   `tsconfig.json`: TypeScript configuration for the package
*   Entry points for consistent importing

## Technology Stack

### Frontend

*   **Framework**: React 18
*   **Language**: TypeScript
*   **Module System**: ES Modules (ESM) with .js extensions for imports
*   **Build Tool**: Vite
*   **UI Framework**: Custom components library built on Radix UI primitives
*   **Styling**: Tailwind CSS
*   **State Management**: React Context API and hooks system (potentially Zustand/Jotai for specific complex states)
*   **Routing**: React Router (v6)
*   **Form Handling**: React Hook Form with Zod validation
*   **API Client**: tRPC client for type-safe API calls
*   **Real-time Communication**: SSE (Server-Sent Events) client for streaming
*   **Markdown Rendering**: React Markdown with remark-gfm
*   **Data Visualization**: Recharts
*   **Progressive Web App**: Vite PWA plugin

### Backend

*   **Runtime**: Node.js
*   **Language**: TypeScript with ESM
*   **API Framework**: tRPC for type-safe API endpoints
*   **AI Orchestration**: Custom agentic framework for agent workflows
*   **LLM Provider Abstraction**:
    *   Modular architecture allowing seamless switching between different LLM providers
    *   Two-layer design with Adapters (high-level interfaces) and Handlers (low-level API clients)
    *   Support for advanced features like reasoning, caching, and detailed token usage tracking
    *   Modern ESM-compatible implementation with TypeScript
*   **Streaming Protocol**: Server-Sent Events (SSE) for real-time communication
*   **Database Client**: Supabase.js
*   **Authentication**: Supabase Auth with JWT validation
*   **Tool Calling**: Server-side interception and execution of Claude API tool calls
*   **Path Normalization**: Express middleware for consistent API endpoint routing

### Infrastructure

*   **Database**: Supabase PostgreSQL
*   **Authentication**: Supabase Auth with Google Auth integration
*   **Storage**: Supabase Storage
*   **Frontend Hosting**: Netlify
*   **Backend Hosting**: Google Cloud Run
*   **CI/CD**: GitHub Actions
*   **Monorepo Management**: Turborepo for build orchestration

### Development Tools

*   **Package Management**: NPM with workspaces
*   **Build Orchestration**: Turborepo
*   **Code Quality**: ESLint with flat configuration
*   **Formatting**: Prettier
*   **Git Hooks**: Husky with lint-staged

## Data Schema

### Core Tables

All tables include standard fields: `id` (UUID primary key), `created_at`, `updated_at`, and potentially `deleted_at` (for soft deletes where appropriate).

#### `users`

| Column       | Type      | Description                                |
| :----------- | :-------- | :----------------------------------------- |
| id           | UUID      | Primary key, linked to Supabase auth.users |
| email        | TEXT      | User's email address                       |
| full\_name   | TEXT      | User's full name                           |
| avatar\_url  | TEXT      | URL to user's profile image                |
| bio          | TEXT      | User's biography                           |
| is\_admin    | BOOLEAN   | Flag indicating admin privileges           |
| created\_at  | TIMESTAMP | Timestamp of user creation                 |
| updated\_at  | TIMESTAMP | Timestamp of last update                   |

#### `entities`

| Column            | Type      | Description                                                                          |
| :---------------- | :-------- | :----------------------------------------------------------------------------------- |
| id                | UUID      | Primary key                                                                          |
| user\_id          | UUID      | References `users.id`                                                                |
| title             | TEXT      | Entity name (e.g., Project Title, Document Name)                                     |
| entity\_type      | TEXT      | Type of entity ('project', 'lean\_canvas', 'journal', etc.)                           |
| content           | TEXT      | Optional main content or description (for simpler entities)                          |
| metadata          | JSONB     | Flexible field for additional properties (e.g., status, specific type attributes)    |
| active\_version\_id | UUID      | References `entity_versions.id` (points to the current active version, if versioned) |
| created\_at       | TIMESTAMP | Timestamp of entity creation                                                         |
| updated\_at       | TIMESTAMP | Timestamp of last update                                                             |

#### `entity_versions`

| Column                | Type      | Description                                                              |
| :-------------------- | :-------- | :----------------------------------------------------------------------- |
| id                    | UUID      | Primary key                                                              |
| entity\_id            | UUID      | References `entities.id`                                                 |
| entity\_type          | TEXT      | Type of the related entity (matches `entities.entity_type`)              |
| version\_number       | INTEGER   | Sequential version number for the entity                                 |
| full\_content         | JSONB/TEXT| Complete content snapshot for this version                               |
| changes               | JSONB     | Diff from the base version (optional, e.g., JSON Patch)                  |
| base\_version\_id     | UUID      | References `entity_versions.id` (parent version for diffing)             |
| created\_by\_message\_id | UUID      | References `messages.id` (links version creation to a specific message)  |
| version\_type         | TEXT      | Nature of the version (e.g., 'initial', 'user\_edit', 'ai\_suggestion')  |
| significance          | TEXT      | Description of the version's importance or changes                       |
| user\_label           | TEXT      | User-defined label for the version                                       |
| created\_at           | TIMESTAMP | Timestamp of version creation                                            |

#### `messages`

| Column                  | Type         | Description                                                              |
| :---------------------- | :----------- | :----------------------------------------------------------------------- |
| id                      | UUID         | Primary key                                                              |
| user\_id                | UUID         | References `users.id` (for user messages)                              |
| sender\_type            | TEXT         | 'user', 'ai'                                                             |
| content                 | TEXT         | Message content                                                          |
| context\_type           | TEXT         | 'entity', 'project', 'system', etc. (Indicates the context scope)        |
| context\_id             | UUID         | References `entities.id` (Links message to a specific entity/project)    |
| detected\_intent        | TEXT[]       | Intent tags detected in message                                          |
| has\_proposed\_changes  | BOOLEAN      | Whether message proposes entity changes                                  |
| proposed\_entity\_changes | JSONB        | Structured changes to entities proposed by the message                   |
| display\_thread\_id     | UUID         | For UI organization/grouping                                             |
| reply\_to\_message\_id  | UUID         | References `messages.id`                                                 |
| content\_embedding      | VECTOR(1536) | Vector embedding for semantic search (requires `pgvector` extension)   |
| created\_at             | TIMESTAMP    | Timestamp of message creation                                            |

#### `message_tags`

| Column     | Type      | Description                       |
| :--------- | :-------- | :-------------------------------- |
| id         | UUID      | Primary key                       |
| message_id | UUID      | References `messages.id`          |
| tag        | TEXT      | Tag value                         |
| created_by | TEXT      | 'user', 'ai', 'system'            |

#### `message_references`

| Column         | Type      | Description                                           |
| :------------- | :-------- | :---------------------------------------------------- |
| id             | UUID      | Primary key                                           |
| message_id     | UUID      | References `messages.id`                              |
| entity_type    | TEXT      | 'canvas', 'project', etc.                             |
| entity_id      | UUID      | ID of referenced entity                               |
| reference_type | TEXT      | 'mentions', 'modifies', 'creates', 'analyzes', etc.   |

#### `questionnaires`

Stores the definitions and metadata for different versions of questionnaires.

| Column      | Type      | Description                                                                      |
| :---------- | :-------- | :------------------------------------------------------------------------------- |
| id          | UUID      | Primary Key. Unique identifier for this specific questionnaire version.          |
| name        | TEXT      | Human-readable name for internal reference (e.g., "Onboarding v1.1").            |
| type        | TEXT      | Category of the questionnaire (e.g., 'onboarding', 'feedback').                  |
| version     | INTEGER   | Sequential version number *within* a specific `type`.                            |
| structure   | JSONB     | **The core definition:** An ordered array of question and info_step objects.      |
| is_active   | BOOLEAN   | If `true`, this is the current version presented for its `type`.                 |
| created_at  | TIMESTAMP | Timestamp of creation.                                                           |
| updated_at  | TIMESTAMP | Timestamp of last update.                                                        |

#### `questionnaire_responses`

Stores user progress and answers for a specific questionnaire instance they interacted with.

| Column             | Type      | Description                                           |
|-------------------|-----------|-------------------------------------------------------|
| id                | UUID      | Primary key                                           |
| user_id           | UUID      | Foreign key to users table                            |
| questionnaire_id  | UUID      | Foreign key to questionnaires table                   |
| responses         | JSONB     | JSON object with question responses                   |
| status            | TEXT      | Status of questionnaire (not_started, in_progress, completed) |
| started_at        | TIMESTAMP | When the user started the questionnaire               |
| completed_at      | TIMESTAMP | When the user completed the questionnaire             |
| created_at        | TIMESTAMP | Record creation timestamp                             |
| updated_at        | TIMESTAMP | Record update timestamp                               |

### Relationships

*   `users` to `entities`: 1:N (One user can own multiple entities)
*   `users` to `questionnaire_responses`: 1:N (One user can have multiple responses)
*   `entities` to `entity_versions`: 1:N (An entity has multiple versions)
*   `entities` to `messages`: 1:N (Messages can reference specific entities via `context_id`)
*   `questionnaires` to `questionnaire_responses`: 1:N (A questionnaire version can have many responses)
*   `messages` to `message_tags`: 1:N (A message can have multiple tags)
*   `messages` to `message_references`: 1:N (A message can reference multiple entities/concepts)
*   `entity_versions` to `messages`: 1:N (A version can be created by a message)
*   `entity_versions` to `entity_versions`: 1:N (Versions can have base versions for diffing)

### Indices

*   `users`: email
*   `entities`: user_id, entity_type, active_version_id
*   `entity_versions`: entity_id, entity_type, created_by_message_id, base_version_id
*   `messages`: user_id, context_id, created_at, display_thread_id, reply_to_message_id, content_embedding (using pgvector index e.g., IVFFlat or HNSW)
*   `message_tags`: message_id, tag
*   `message_references`: message_id, entity_id, entity_type, reference_type
*   `questionnaires`: (type, version) UNIQUE, (type, is_active)
*   `questionnaire_responses`: (user_id, questionnaire_id) UNIQUE (if only one attempt allowed per version), user_id, status

## API Endpoints

The API follows tRPC conventions for type-safe communication between client and server. Defined in `apps/api/src/routers/`.

### Core Routers and Endpoints

#### `auth` Router

*   `auth.login`: Login with email/password or OAuth
*   `auth.register`: Register a new user
*   `auth.logout`: Logout current user
*   `auth.getSession`: Get current session info

#### `entities` Router

*   `entities.create`: Create a new entity (e.g., project, document)
*   `entities.get`: Get an entity by ID
*   `entities.list`: List entities for a user (potentially filtered by type)
*   `entities.update`: Update entity details (title, metadata)
*   `entities.delete`: Delete an entity (soft delete recommended)

#### `entityVersions` Router

*   `entityVersions.create`: Create a new entity version (e.g., saving changes)
*   `entityVersions.get`: Get a specific version by ID
*   `entityVersions.list`: List versions for an entity
*   `entityVersions.revertTo`: Make a previous version the active one (updates `entities.active_version_id`)

#### `messages` Router

*   `messages.create`: Create a new message
*   `messages.get`: Get a message by ID
*   `messages.list`: List messages for a context
*   `messages.update`: Update a message
*   `messages.delete`: Delete a message

#### `ai` Router

*   `ai.streamConversation`: SSE endpoint for streaming AI responses for a given context.
*   `ai.askQuestion` (Potentially merged into `messages.create` with AI handling): Send a question to the AI agent.
*   `ai.executeAction`: Execute an AI tool action (likely handled internally during stream/response generation).

#### `questionnaires` Router

*   `questionnaires.getActive`: Fetches the structure of the active questionnaire for a given type (e.g., 'onboarding'). Input: `{ type: string }`. Output: `Questionnaire | null`.
*   (Admin only potentially) `questionnaires.create`: Create a new questionnaire version.
*   (Admin only potentially) `questionnaires.update`: Update questionnaire details / structure.
*   (Admin only potentially) `questionnaires.setActive`: Set a specific version as active (and deactivate others of the same type).

#### `questionnaireResponses` Router

*   `questionnaireResponses.findOrCreate`: Finds an 'in_progress' or 'not_started' response for a user and active questionnaire type, or creates a new one if none exists. Input: `{ questionnaireType: string }`. Output: `{ questionnaire, questionnaireResponse }`.
*   `questionnaireResponses.get`: Fetches a specific response record by ID (useful for resuming). Input: `{ responseId: string }`. Output: `QuestionnaireResponse`.
*   `questionnaireResponses.update`: Updates the `responses` JSON and potentially `status`. Input: `{ responseId: string, responses: object, status?: string }`. Output: `Success/Failure`.
*   `questionnaireResponses.submit`: Final update, marks as 'completed'. Input: `{ responseId: string, responses: object }`. Output: `Success/Failure`.

## Component Library

Located in `packages/ui/`. Built on Radix UI primitives and styled with Tailwind CSS.

#### Layout Components

*   **AppShell**: Main application layout with sidebar, header, and content area
*   **Sidebar**: Collapsible navigation sidebar
*   **Panel**: Split panel container with resizable areas
*   **Card**: Basic container with header, content, and footer areas

#### Interactive Components

*   **Button**: Primary, secondary, ghost, and destructive variants
*   **Input**: Text input with validation states
*   **Select**: Dropdown select with multi-select option
*   **Checkbox**: Checkboxes with labels and validation
*   **RadioGroup**: Radio button groups
*   **Switch**: Toggle switches for boolean values
*   **Tabs**: Tabbed interface for content organization
*   **Dialog**: Modal dialogs for focused interactions
*   **Toast**: Notification system for feedback

#### Data Display Components

*   **Table**: Data table with sorting and pagination
*   **List**: Ordered and unordered lists with item variants
*   **Tree**: Hierarchical tree view for nested data
*   **Avatar**: User avatar with fallback
*   **Badge**: Status badges for visual indicators
*   **Progress**: Progress bar and spinner components

#### Special Purpose Components

*   **Chat**: Chat interface with message bubbles and input (`apps/web/`)
*   **EntityEditor**: Generic entity editing interface (`apps/web/`)
*   **CanvasView**: Visual canvas representation (likely specific entity type view) (`apps/web/`)
*   **CodeBlock**: Syntax highlighted code blocks (`packages/ui/`)
*   **QuestionnaireRenderer**: Dynamically renders questionnaire steps based on JSON structure (`apps/web/features/onboarding/`)
*   **InfoStepDisplay**: Renders the informational steps within the questionnaire (`apps/web/features/onboarding/`)
*   Specific Question Type Components (e.g., `SingleChoiceQuestion`, `ScaleQuestion`) used by `QuestionnaireRenderer` (`apps/web/features/onboarding/components/`)

## Utility Functions

Located primarily in `packages/utils/` for shared utilities, and `apps/web/src/utils/` or `apps/api/src/utils/` for app-specific ones.

### Supabase Integration (`packages/utils/`)

*   **createSupabaseClient**: Create and configure Supabase client (client-side and server-side versions)
*   **getUser**: Get current authenticated user (server-side helper)
*   **getSession**: Get current authentication session (client-side helper)

### Data Handling (`packages/utils/`)

*   **formatDate**: Format date strings consistently
*   **slugify**: Convert strings to URL-friendly slugs
*   **debounce / throttle**: Utility functions for input handling/API calls
*   **sortBy**: Generic sorting utility

### State Management (`apps/web/src/hooks/` or `apps/web/src/contexts/`)

*   **createContext**: Utility for creating typed context with proper provider and hook.
*   **useLocalStorage**: Hook for persistent state with localStorage.

### AI Integration (`apps/api/src/services/ai/` or `packages/ai-tools/`)

*   **createAIStream**: Create an SSE stream for AI responses
*   **parseToolCalls**: Parse and process AI tool calls from LLM response
*   **updateEntityFromToolCall**: Apply entity changes based on AI tool call
*   **streamEndpointPath**: Constant defining the SSE stream path (`/api/ai/stream`)

### Questionnaire Handling (`apps/web/src/features/onboarding/utils/`)

*   **evaluateCondition**: Function to evaluate the `condition` object of an `info_step` based on current responses.
*   **validateResponse**: Function to validate user input for a question based on its `required` status and type constraints.

## State Management

### Global State (`apps/web/src/contexts/`)

*   **AuthContext**: User authentication state, profile.
*   **UIContext**: Global UI state (theme, sidebar open/closed, potentially modal states).
*   **NotificationContext**: Manages toast notifications.

### Feature-specific State

Managed via local component state (`useState`, `useReducer`) or feature-specific contexts/state libraries (like Zustand) where necessary.

*   **EntityContext**: State for the currently viewed/edited entity, its active version, and potentially recent versions (`apps/web/src/features/entities/`).
*   **ChatContext**: State for the current chat conversation, messages, streaming status (`apps/web/src/features/chat/`).
*   **QuestionnaireContext**: State during an active questionnaire session, including current step index, user responses (`apps/web/src/features/onboarding/`).

### State Management Patterns

*   Use React Context for low-frequency update global/shared state (Auth, UI Theme).
*   Use local component state (`useState`) for UI-specific, non-shared state.
*   Consider Zustand or Jotai for complex, high-frequency update states shared across non-parent/child components (e.g., complex editor state).
*   Use custom hooks (`useEntity`, `useChat`) to encapsulate state logic and data fetching.
*   Prefer server state managed via tRPC queries/mutations (`react-query` integration) for data persistence. Client state synchronizes with server state.

## Authentication Flow

1.  **Initial Authentication**:
    *   User visits app, checks for existing Supabase session.
    *   If no session, prompts login/signup (Email/Password or Google OAuth via Supabase UI/SDK).
    *   On successful auth, Supabase returns a JWT session.
    *   Frontend stores session (Supabase SDK handles this) and fetches user profile (`users` table) via tRPC.
    *   User data stored in `AuthContext`.

2.  **Session Management**:
    *   Supabase client SDK automatically attaches JWT to outgoing requests (if configured correctly with tRPC).
    *   Backend tRPC middleware verifies JWT validity using Supabase Auth helpers.
    *   SDK handles automatic token refreshing.
    *   Session validity checked on app load and potentially periodically.

3.  **Authorization**:
    *   **API Level:** tRPC middleware ensures user is authenticated for protected procedures. Procedures check if the authenticated user has permission to access/modify the requested resource (e.g., checking `user_id` on an entity).
    *   **Database Level:** Supabase Row Level Security (RLS) policies are implemented on tables (`entities`, `messages`, `questionnaire_responses`, etc.) to ensure users can only access/modify their own data by default. Policies check `auth.uid()` against the `user_id` column.

## External Services

### Supabase

*   **Purpose**: Database, Authentication, Storage
*   **Configuration**: Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for backend).
*   **Features Used**: PostgreSQL Database, Auth (JWT, OAuth, Email/Password), Storage (for user avatars, potentially document attachments), Row Level Security (RLS).

### Claude API (via Anthropic)

*   **Purpose**: AI agent for chat, document generation, and strategic guidance.
*   **Integration**: Via the custom LLM Provider Abstraction layer (`packages/ai-tools/`). Uses `AnthropicAdapter` and `AnthropicHandler`.
*   **Configuration**: `ANTHROPIC_API_KEY` in environment variables.
*   **Features Used**: Text generation, Streaming responses (SSE), Tool Calling (Function Calling) for structured actions like entity updates, potentially different model versions (Claude 3.5 Sonnet, Haiku, etc.).

### Google Auth

*   **Purpose**: OAuth authentication provider integrated with Supabase Auth.
*   **Configuration**: OAuth client ID and secret configured in Supabase Auth dashboard.
*   **Features Used**: User authentication via Google accounts.

### Netlify

*   **Purpose**: Frontend hosting and deployment (`apps/web/`).
*   **Configuration**: `netlify.toml` defines build commands, output directory (`apps/web/dist`), environment variables proxying.
*   **Features Used**: Continuous Deployment (via GitHub Actions trigger or Netlify integration), CDN, potentially Netlify Functions for simple tasks (though primary backend is on Cloud Run).

### Google Cloud Run

*   **Purpose**: Backend API service hosting (`apps/api/`).
*   **Configuration**: `Dockerfile` in `apps/api/`, Google Cloud Build/Run deployment scripts/config (e.g., `cloudbuild.yaml`). Requires service account configuration, environment variable management.
*   **Features Used**: Serverless container hosting, auto-scaling, request-based pricing.

## Design Patterns

### CRUD Operations

1.  Define shared types for the data entity (`packages/types/`).
2.  Define Zod schemas for input validation (`packages/types/` or within router files).
3.  Create tRPC procedures (query/mutation) in the relevant backend router (`apps/api/src/routers/`).
4.  Implement database logic using Supabase client within the procedure's resolver, ensuring user authorization (checking `ctx.user.id`).
5.  Return typed response.
6.  Frontend uses tRPC client hooks (`api.router.procedure.useQuery`/`useMutation`) to interact with the API.
7.  Utilize `react-query` cache invalidation and optimistic updates for better UX.

### Error Handling

1.  Use `try/catch` in async operations (especially API calls, external service interactions).
2.  tRPC allows throwing specific `TRPCError` types (e.g., `UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`) which are propagated to the client with type safety.
3.  Frontend uses `error` state from tRPC hooks to display appropriate feedback (e.g., toast notifications via `NotificationContext`, inline error messages).
4.  Implement global error boundaries in React for unexpected client-side errors.
5.  Log detailed errors on the backend (consider structured logging service).

### Real-time Updates (SSE)

1.  Backend defines an SSE endpoint (e.g., `/api/ai/stream`).
2.  Client uses `EventSource` API to connect to the endpoint.
3.  Backend streams data chunks (e.g., AI message tokens) using `res.write()`. Each chunk follows SSE format (`data: ...\n\n`).
4.  Client listens for `message` events, parses `event.data`, and updates UI incrementally (e.g., appending text to chat message).
5.  Backend signals end of stream appropriately (e.g., sending a special `event: end` message or just closing the connection).
6.  Handle connection errors and retries on the client.

### Tool Calling Pattern (AI)

1.  Define available tools (functions the AI can request to call) with names, descriptions, and parameter schemas (e.g., using JSON schema).
2.  Include tool definitions in the prompt/API call to the LLM (Claude API).
3.  LLM response indicates a tool call request with arguments.
4.  Backend intercepts this specific response structure.
5.  Backend executes the corresponding server-side function with the provided arguments (e.g., `updateEntity`, `searchWeb`).
6.  Backend performs the action (e.g., update database, call external API).
7.  (Crucial for streaming) Acknowledge tool execution success *immediately* back to the LLM API if necessary to allow text generation to continue seamlessly (specific to some provider implementations).
8.  Optionally, send the *result* of the tool execution back to the LLM in a subsequent message turn for it to incorporate into its final response.
9.  Update application state/UI based on the tool's side effects (e.g., entity updated in DB triggers UI refresh).

### API Path Normalization

1.  Express middleware (`apps/api/src/index.ts`) intercepts requests.
2.  If path starts with `/api`, middleware removes this prefix before passing to the tRPC Express adapter.
3.  Allows frontend to consistently use `/api/trpc/*` paths, regardless of whether the backend is running standalone (dev) or behind a gateway/proxy (prod) that might strip `/api`.
4.  Backend tRPC routers are defined *without* the `/api` prefix.

### LLM Provider Abstraction (`packages/ai-tools/`)

1.  Define core interfaces (`LLMAdapter`, `LLMHandler`) specifying methods like `chat`, `streamChat`, `invokeTool`.
2.  Implement concrete Adapters (e.g., `AnthropicAdapter`) that handle high-level logic, message formatting, and delegate low-level API calls.
3.  Implement concrete Handlers (e.g., `AnthropicHandler`) responsible for direct API interaction (fetching, error handling, retries) with a specific provider.
4.  Use a Factory (`LLMFactory`) to instantiate the correct Adapter/Handler based on environment configuration.
5.  Application code interacts only with the `LLMAdapter` interface, ensuring provider-agnosticism.
6.  Supports advanced features (caching, reasoning calls, token tracking) via optional interface methods or specific adapter implementations.

### Custom Agentic Framework (`apps/api/src/services/ai/`)

1.  **Simplified Architecture**: Central agent logic resides in `agent.ts`. May use helper classes/functions for clarity. Leverages LangGraph *types* for structure but implements custom state management and execution flow.
2.  **Message/State Management**: Agent loads relevant context (user info, entity data, message history) from database based on request context (`context_id`). Manages conversation state in memory during a request/stream, persisting results back to `messages` and potentially `entities`/`entity_versions` tables.
3.  **Tool Execution**: Parses LLM output for predefined tool call syntax (e.g., Claude's XML format). Executes tools defined in `packages/ai-tools/tools/` using application context (DB clients, etc.). Handles tool success/error feedback for the agent loop.
4.  **Streaming Integration**: Designed to work with SSE. Tool calls might pause the direct streaming of LLM text, execute the tool, and then resume streaming, or acknowledge the tool call to the LLM provider immediately while executing the tool asynchronously (depending on provider requirements for smooth streaming).

### JSON-Driven UI Structure (Questionnaires)

1.  Define dynamic UI structures (like questionnaires) as JSON data stored in the database (e.g., `questionnaires.structure`).
2.  JSON schema defines different item types (`single_choice`, `info_step`, etc.) and their properties.
3.  Implement versioning (`questionnaires.version`) and activation (`questionnaires.is_active`) for managing changes.
4.  Frontend fetches the active JSON structure via API.
5.  A dedicated renderer component (`QuestionnaireRenderer`) iterates through the JSON array.
6.  Based on the `item.type`, it dynamically renders the corresponding UI component (e.g., `SingleChoiceQuestion`, `InfoStepDisplay`).
7.  Conditional logic (`info_step.condition`) is evaluated client-side based on current responses to determine visibility.
8.  User responses are collected and stored, mapping question IDs to values (`questionnaire_responses.responses`).
9.  **Benefits**: High flexibility, allows content/structure updates without frontend deployment.

## Features

### Entity Creation and Editing (Documents, Projects, etc.)

*   **Purpose**: Allow users to create and manage various structured entities (Lean Canvas, project plans, etc.) within the platform, assisted by AI.
*   **Technical Implementation**:
    *   Uses the generic `entities` and `entity_versions` tables. `entity_type` determines behavior/rendering.
    *   `entity_versions.full_content` stores the main data (e.g., JSON for Lean Canvas).
    *   Frontend uses dynamic components (`EntityEditor`, specific views like `CanvasView`) based on `entity_type`.
    *   Saving creates a new `entity_versions` record. `entities.active_version_id` points to the current one.
    *   AI interaction (via Chat) uses tool calls (`entityUpdate`) to propose changes, which result in new suggested `entity_versions`.
*   **Current Status**: Core functionality planned for Milestone 1.
*   **Dependencies**: Supabase (DB), tRPC (API), React Components, AI Tool Calling.

### AI Chat Interface

*   **Purpose**: Provide a contextual, conversational interface for users to interact with AI assistants (Mentor, Generator) for guidance, content generation, and entity modification.
*   **Technical Implementation**:
    *   Frontend `Chat` component connects to backend SSE endpoint (`ai.streamConversation`).
    *   Messages stored in `messages` table, linked via `context_id` to the relevant `entity` or `project`.
    *   Backend uses Custom Agentic Framework and LLM Abstraction Layer to handle conversation flow, context management, and LLM interaction (Claude).
    *   Streaming via SSE provides real-time responses.
    *   Tool calls within AI responses are intercepted and executed server-side.
    *   User preferences (from onboarding) are passed as context to tailor AI responses.
*   **Current Status**: Core functionality implemented in Milestone 1.
*   **Dependencies**: SSE, Custom Agentic Framework, LLM Abstraction, Supabase (DB), React Components.

### Version Control (for Entities)

*   **Purpose**: Allow users to view the history of changes to their entities and revert to previous states.
*   **Technical Implementation**:
    *   Leverages the `entity_versions` table, which stores snapshots (`full_content`) of entities over time.
    *   `entities.active_version_id` indicates the currently live version.
    *   Frontend component displays a list of versions (`entityVersions.list` API call) for a given entity.
    *   Reverting involves updating `entities.active_version_id` to point to an older `entity_versions.id` (`entityVersions.revertTo` API call).
    *   Optional: Use JSON diff library to compute and display `changes` between versions.
*   **Current Status**: Planned for Milestone 2.
*   **Dependencies**: Supabase (DB), tRPC (API), React Components (Version History Display).

### Dynamic Questionnaire System (Onboarding & Feedback)

*   **Purpose**: Provide a flexible system for creating and managing questionnaires, initially used for user onboarding to personalize the experience, but extensible for feedback, etc.
*   **Technical Implementation**:
    *   Uses `questionnaires` table to store versioned JSON definitions (`structure`) of questionnaires, categorized by `type` (e.g., 'onboarding').
    *   `is_active` flag controls which version is presented.
    *   `structure` JSON defines an array of steps (questions like `single_choice`, `text_input`; informational steps `info_step`).
    *   `info_step` can be conditionally displayed based on previous answers using the `condition` object.
    *   Frontend uses `QuestionnaireRenderer` component to dynamically display steps based on fetched JSON structure and evaluates conditions.
    *   User answers are stored in `questionnaire_responses` table (`responses` JSONB field), linked to the specific `questionnaire` version answered.
    *   API endpoints (`questionnaires`, `questionnaireResponses` routers) manage fetching structures and saving responses.
    *   Onboarding responses are used to tailor initial AI interactions.
*   **Current Status**: Design complete, implementation planned for Milestone 1 / early Milestone 2.
*   **Dependencies**: Supabase (DB), tRPC (API), React Components (`QuestionnaireRenderer`, etc.).