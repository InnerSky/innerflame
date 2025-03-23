# Technical Blueprint

## Table of Contents
- [Introduction](#introduction)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Data Schema](#data-schema)
- [API Endpoints](#api-endpoints)
- [Component Library](#component-library)
- [Utility Functions](#utility-functions)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [External Services](#external-services)
- [Design Patterns](#design-patterns)
- [Features](#features)

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
│   │   │   ├── features/   # Feature-specific code
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
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── services/
│       │   │   └── ai/     # AI agent implementation
│       │   │       └── agent.ts  # Custom agentic framework implementation
│       │   ├── utils/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── types/              # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── document.ts # Document-related types
│   │   │   ├── project.ts  # Project-related types
│   │   │   ├── message.ts  # Message-related types
│   │   │   └── index.ts
│   │   └── package.json
│   ├── ui/                 # Shared UI components
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
│       │   │   ├── documentUpdate.ts  # Document modification tool
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
│   └── other documentation
├── netlify.toml            # Netlify deployment configuration
├── package.json            # Root package.json with workspaces
├── tsconfig.json           # Base TypeScript configuration
├── turbo.json              # Turborepo configuration
└── eslint.config.js        # ESLint configuration
```

### Configuration Overview

#### Root Configuration
- `package.json`: Defines workspaces and shared dependencies
- `tsconfig.json`: Base TypeScript configuration with path aliases for packages
- `turbo.json`: Defines the build pipeline and task dependencies
- `eslint.config.js`: Unified ESLint configuration for code quality
- `.prettierrc.json`: Formatting standards
- `netlify.toml`: Deployment configuration for the web application

#### Web Application Configuration
- `apps/web/vite.config.ts`: Sets up build tools, plugins, and path aliases
- `apps/web/tsconfig.json`: Extends root configuration with web-specific settings
- `apps/web/tailwind.config.js`: Styling configuration for the web app

#### Package Configuration
Each package in the `packages/` directory has its own:
- `package.json`: Defines dependencies and build scripts
- `tsconfig.json`: TypeScript configuration for the package
- Entry points for consistent importing

## Technology Stack

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Module System**: ES Modules (ESM) with .js extensions for imports
- **Build Tool**: Vite
- **UI Framework**: Custom components library built on Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Context API and hooks system
- **Routing**: React Router (v6)
- **Form Handling**: React Hook Form with Zod validation
- **API Client**: tRPC client for type-safe API calls
- **Real-time Communication**: SSE (Server-Sent Events) client for streaming
- **Markdown Rendering**: React Markdown with remark-gfm
- **Data Visualization**: Recharts
- **Progressive Web App**: Vite PWA plugin

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript with ESM
- **API Framework**: tRPC for type-safe API endpoints
- **AI Orchestration**: Custom agentic framework for agent workflows
- **LLM Provider Abstraction**: 
  - Modular architecture allowing seamless switching between different LLM providers
  - Two-layer design with Adapters (high-level interfaces) and Handlers (low-level API clients)
  - Support for advanced features like reasoning, caching, and detailed token usage tracking
  - Modern ESM-compatible implementation with TypeScript
- **Streaming Protocol**: Server-Sent Events (SSE) for real-time communication
- **Database Client**: Supabase.js
- **Authentication**: Supabase Auth with JWT validation
- **Tool Calling**: Server-side interception and execution of Claude API tool calls
- **Path Normalization**: Express middleware for consistent API endpoint routing

### Infrastructure
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with Google Auth integration
- **Storage**: Supabase Storage
- **Frontend Hosting**: Netlify
- **Backend Hosting**: Google Cloud Run
- **CI/CD**: GitHub Actions
- **Monorepo Management**: Turborepo for build orchestration

### Development Tools
- **Package Management**: NPM with workspaces
- **Build Orchestration**: Turborepo
- **Code Quality**: ESLint with flat configuration
- **Formatting**: Prettier
- **Git Hooks**: Husky with lint-staged

## Data Schema

### Core Tables
All tables include standard fields: id (UUID primary key), created_at, updated_at, and deleted_at (for soft deletes).

#### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, linked to Supabase auth.users |
| email | TEXT | User's email address |
| name | TEXT | User's full name |
| avatar_url | TEXT | URL to user's profile image |
| preferences | JSONB | User settings and preferences |

#### projects
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References users.id |
| name | TEXT | Project name |
| description | TEXT | Project description |
| status | TEXT | 'active', 'archived', 'deleted' |

#### documents
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | References projects.id |
| document_type | TEXT | 'lean_canvas', 'future_press_conference', etc. |
| name | TEXT | Document name |
| status | TEXT | 'draft', 'completed', 'archived' |
| version | INTEGER | Current version number |
| data_type | TEXT | 'json', 'html', 'markdown' |

#### document_versions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | References documents.id |
| version | INTEGER | Version number |
| content | JSONB/TEXT | Document content (format depends on data_type) |
| created_by | UUID | References users.id |
| timestamp | TIMESTAMP | When version was created |

#### messages
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References users.id |
| sender_type | TEXT | 'user', 'ai' |
| content | TEXT | Message content |
| context_type | TEXT | 'canvas', 'journal', etc. |
| context_id | UUID | References documents.id or projects.id |
| detected_intent | TEXT[] | Intent tags detected in message |
| has_proposed_changes | BOOLEAN | Whether message proposes document changes |
| proposed_entity_changes | JSONB | Structured changes to entities |
| display_thread_id | UUID | For UI organization |
| reply_to_message_id | UUID | References messages.id |
| content_embedding | VECTOR(1536) | Vector embedding for semantic search |

#### message_tags
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| message_id | UUID | References messages.id |
| tag | TEXT | Tag value |
| created_by | TEXT | 'user', 'ai', 'system' |

#### message_references
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| message_id | UUID | References messages.id |
| entity_type | TEXT | 'canvas', 'project', etc. |
| entity_id | UUID | ID of referenced entity |
| reference_type | TEXT | 'mentions', 'modifies', 'creates', 'analyzes' |

### Relationships
- users to projects: 1:N (One user can own multiple projects)
- projects to documents: 1:N (A project can contain multiple documents)
- documents to document_versions: 1:N (A document has multiple versions)
- documents to messages: 1:N (Messages can reference specific documents)
- projects to messages: 1:N (Messages can belong to a project)
- messages to message_tags: 1:N (A message can have multiple tags)
- messages to message_references: 1:N (A message can reference multiple entities)

### Indices
- messages: user_id, context_id, created_at, display_thread_id, reply_to_message_id
- entity_versions: entity_id, entity_type, is_current
- message_tags: message_id, tag
- message_references: message_id, entity_id, entity_type, reference_type

## API Endpoints

The API follows tRPC conventions for type-safe communication between client and server.

### Core Endpoints

#### Authentication
- `auth.login`: Login with email/password or OAuth
- `auth.register`: Register a new user
- `auth.logout`: Logout current user
- `auth.getSession`: Get current session info

#### Projects
- `projects.create`: Create a new project
- `projects.get`: Get a project by ID
- `projects.list`: List all projects for a user
- `projects.update`: Update project details
- `projects.delete`: Delete a project

#### Documents
- `documents.create`: Create a new document
- `documents.get`: Get a document by ID
- `documents.list`: List documents for a project
- `documents.update`: Update document details
- `documents.delete`: Delete a document

#### Document Versions
- `documentVersions.create`: Create a new document version
- `documentVersions.get`: Get a specific version
- `documentVersions.list`: List versions for a document
- `documentVersions.revertTo`: Revert to a previous version

#### Messages
- `messages.create`: Create a new message
- `messages.get`: Get a message by ID
- `messages.list`: List messages for a context
- `messages.update`: Update a message
- `messages.delete`: Delete a message

#### AI Interaction
- `ai.streamConversation`: SSE endpoint for streaming AI responses
- `ai.askQuestion`: Send a question to the AI agent
- `ai.executeAction`: Execute an AI tool action

## Component Library

### Core UI Components
Built on Radix UI primitives and styled with Tailwind CSS.

#### Layout Components
- **AppShell**: Main application layout with sidebar, header, and content area
- **Sidebar**: Collapsible navigation sidebar
- **Panel**: Split panel container with resizable areas
- **Card**: Basic container with header, content, and footer areas

#### Interactive Components
- **Button**: Primary, secondary, ghost, and destructive variants
- **Input**: Text input with validation states
- **Select**: Dropdown select with multi-select option
- **Checkbox**: Checkboxes with labels and validation
- **RadioGroup**: Radio button groups
- **Switch**: Toggle switches for boolean values
- **Tabs**: Tabbed interface for content organization
- **Dialog**: Modal dialogs for focused interactions
- **Toast**: Notification system for feedback

#### Data Display Components
- **Table**: Data table with sorting and pagination
- **List**: Ordered and unordered lists with item variants
- **Tree**: Hierarchical tree view for nested data
- **Avatar**: User avatar with fallback
- **Badge**: Status badges for visual indicators
- **Progress**: Progress bar and spinner components

#### Special Purpose Components
- **Chat**: Chat interface with message bubbles and input
- **DocumentEditor**: Document editing interface with sections
- **CanvasView**: Visual canvas representation of document
- **CodeBlock**: Syntax highlighted code blocks

## Utility Functions

### Supabase Integration
- **createSupabaseClient**: Create and configure Supabase client
- **getUser**: Get current authenticated user
- **getSession**: Get current authentication session

### Data Handling
- **formatDate**: Format date strings consistently
- **slugify**: Convert strings to URL-friendly slugs
- **debounce**: Debounce function for input handling
- **sortByCreatedAt**: Sort arrays by timestamp

### State Management
- **createContext**: Create typed context with error handling
- **useLocalStorage**: Persistent state with localStorage

### AI Integration
- **createAIStream**: Create an SSE stream for AI responses
- **parseToolCalls**: Parse and process AI tool calls
- **updateDocumentFromToolCall**: Apply document changes from AI tool call
- **streamEndpointPath**: Consistently use `/api/ai/stream` for API endpoints

## State Management

### Global State
- **AuthContext**: User authentication state
- **UIContext**: Global UI state (theme, sidebar open/closed)
- **NotificationContext**: Toast notifications system

### Feature-specific State
- **ProjectContext**: Current project state
- **DocumentContext**: Current document state and versions
- **ChatContext**: Chat conversation state

### State Management Patterns
- Use React Context for global/shared state
- Use local component state for UI-specific state
- Use custom hooks for reusable state logic
- Prefer server state for data that should be persisted

## Authentication Flow

1. **Initial Authentication**:
   - User signs in via Supabase Auth (email/password or Google)
   - JWT token is stored securely
   - User profile is fetched and stored in AuthContext

2. **Session Management**:
   - JWT token is included with all API requests
   - Token is refreshed automatically when needed
   - Session is checked on application startup

3. **Authorization**:
   - Projects and documents are protected by user_id
   - Row-level security in Supabase enforces ownership
   - API endpoints verify authentication before operations

## External Services

### Supabase
- **Purpose**: Database, authentication, and storage
- **Configuration**: Environment variables for URL and key
- **Features Used**: Auth, Database, Storage, and RLS

### Claude API
- **Purpose**: AI agent for document assistance
- **Integration**: 
  - Implemented via LLM Provider abstraction layer
  - Two-layer architecture with AnthropicAdapter and AnthropicHandler
  - Support for multiple Claude models (3.5, 3.7, etc.)
  - Enhanced capabilities including reasoning/thinking, caching, and detailed usage metrics
- **Configuration**: API key in environment variables
- **Features Used**: 
  - Tool calling for document operations
  - Streaming responses with SSE
  - Reasoning capabilities for enhanced transparency
  - Caching for improved performance

### Google Auth
- **Purpose**: OAuth authentication provider
- **Configuration**: OAuth client ID in Supabase dashboard
- **Features Used**: User authentication

### Netlify
- **Purpose**: Frontend hosting and deployment
- **Configuration**: Build commands in netlify.toml
- **Features Used**: Continuous deployment, serverless functions

### Google Cloud Run
- **Purpose**: Backend service hosting
- **Configuration**: Dockerfile and deployment scripts
- **Features Used**: Container hosting, scaling

## Design Patterns

### CRUD Operations
1. Define type interfaces for the entity
2. Create tRPC procedure for the operation
3. Implement database query using Supabase client
4. Return typed response to the client
5. Handle optimistic updates in the UI when appropriate

### Error Handling
1. Use try/catch blocks for async operations
2. Provide typed error responses from API
3. Use toast notifications for user feedback
4. Log errors to console in development
5. Implement fallback UI for error states

### Real-time Updates
1. Use SSE for streaming AI responses
2. Parse and display incremental updates
3. Store messages in database as they come in
4. Provide visual feedback during streaming

### Tool Calling Pattern
1. AI generates tool calls in structured format
2. Server intercepts tool calls and executes them
3. Document updates are applied to the database
4. Success response is sent immediately to continue streaming
5. UI is updated with the changes

### API Path Normalization
1. Express middleware normalizes paths by removing the `/api` prefix
2. Allows frontend to consistently use `/api/*` endpoints across environments
3. Backend routes are defined once without the prefix but accessible with both patterns
4. Ensures consistent API URL structure between development and production
5. Simplifies frontend code by eliminating environment-specific path handling

### LLM Provider Abstraction
1. Interface-based approach abstracting core LLM functionality
2. Provider factory pattern for selecting and instantiating LLM providers
3. Message format standardization across different provider implementations
4. Streaming and tool calling support maintained with provider-specific adapters
5. Environment-based configuration with fallbacks and validation
6. Two-layer architecture with Adapters and Handlers for cleaner separation of concerns
7. Advanced features supported through provider-specific extensions:
   - Extended thinking/reasoning capabilities for enhanced transparency
   - Prompt caching for improved performance and lower latency
   - Detailed token usage tracking and optimization
   - Automatic retry handling for API rate limits and connection issues
8. Compatibility with multiple Claude model versions (3.5, 3.7, etc.)
9. ESM-compatible implementation with modern TypeScript practices

### Custom Agentic Framework

1. **Simplified Architecture**:
   - Single agent implementation in `apps/api/src/services/ai/agent.ts`
   - Uses typed interfaces from LangGraph for structure but implements custom logic
   - No reliance on external state graph libraries, reducing complexity and dependencies

2. **Message Management**:
   - Handles conversation history and context
   - Maintains message thread structure and relationships
   - Properly formats messages for consumption by LLMs

3. **Tool Execution**:
   - Intercepts special formatting in LLM responses for tool calls
   - Executes tools with proper context and error handling
   - Returns results back to conversation flow

4. **State Management**:
   - Manages agent state including messages, context, and tool results
   - Persists state between interactions in database
   - Handles resuming conversations from saved state

5. **Streaming Integration**:
   - Seamlessly integrates with SSE for streaming responses
   - Handles partial updates and tool calls during streaming
   - Manages streaming interruption and resumption for interactive tools

This custom approach offers greater flexibility and control over the agent workflow while maintaining a clean, type-safe implementation that integrates well with the rest of the application architecture.

## Features

### Document Creation and Editing

**Purpose**: Allow users to create and edit business strategy documents with AI assistance.

**Technical Implementation**:
- Document structure is defined as a TypeScript interface
- Content is stored as JSON in the document_versions table
- UI renders different components based on document_type
- Changes are tracked and versioned for each update
- AI suggestions use tool calls to update specific sections

**Current Status**: In development as part of Milestone 1

**Dependencies**:
- Supabase for document storage
- Claude API for AI assistance
- tRPC for API communication
- UI components for document editing

### AI Chat Interface

**Purpose**: Provide a conversational interface for users to interact with AI assistants.

**Technical Implementation**:
- Chat interface uses SSE for streaming responses
- Messages are stored in the messages table with context references
- AI responses can include special tags for document updates
- Tool calls are processed server-side to execute actions
- Intent detection categorizes messages for better assistance
- LLM Provider abstraction allows flexible integration with different AI models
  - Advanced features enhance the AI experience:
    - Extended thinking/reasoning for greater explainability
    - Prompt caching for faster repeat responses
    - Detailed token usage tracking for optimization
    - Automatic retry handling for reliability
  - Support for multiple Claude models (3.5, 3.7) with model-specific optimizations
- Custom agentic framework handles agent state, message management, and tool execution
- Interface-based architecture supports seamless provider switching without client changes

**Current Status**: Implemented in Milestone 1

**Dependencies**:
- Custom agentic framework for AI orchestration
- LLM Provider abstraction (supports Anthropic/Claude with expansion capability)
- SSE for streaming responses
- Supabase for message storage
- UI components for chat interface

### Version Control

**Purpose**: Track changes to documents and allow reverting to previous versions.

**Technical Implementation**:
- Documents have versions stored in document_versions table
- Each version has a reference to the document and a version number
- Changes can be tracked at the field level using JSON diffing
- Users can view version history and revert to previous versions
- AI can suggest changes as a new version without applying them

**Current Status**: Planned for Milestone 2

**Dependencies**:
- Supabase for version storage
- UI components for version history
- JSON diffing utilities 