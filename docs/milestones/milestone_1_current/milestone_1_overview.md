# Milestone 1: Monorepo Structure Setup & Service Configuration

## Overview
This milestone focuses on transitioning the existing frontend-only application to a comprehensive monorepo structure that will house both the frontend React application and the new backend AI service. This restructuring will enable a more organized development workflow, shared code between frontend and backend, and proper separation of concerns while maintaining type safety across the entire application.

## Objectives
1. Establish a monorepo structure using TypeScript and ESM throughout
2. Migrate the existing frontend application into the monorepo structure
3. Create the foundation for the backend AI service with LangGraph.js
4. Set up shared packages for types, utilities, and UI components
5. Configure Supabase connections for both frontend and backend
6. Implement basic API endpoints with tRPC and SSE support

## Technical Dependencies
- TypeScript and ESM for all packages
- React 18 for frontend
- Node.js/Express for backend
- LangGraph.js for AI orchestration
- tRPC for type-safe API communication
- SSE for real-time streaming
- Supabase for database, authentication, and storage

## Migration Approach

### Phase 1: Monorepo Structure & Configuration (Current)

#### 1. Root Package Setup
- Create root package.json with workspaces configuration
- Set up shared ESLint, Prettier, and TypeScript configurations
- Configure Git hooks and linting rules

#### 2. Project Reorganization
- Create `apps/` directory for application code
  - Move existing frontend to `apps/web/`
  - Create `apps/api/` for the backend service
- Create `packages/` directory for shared code
  - Create `packages/types/` for shared TypeScript interfaces
  - Create `packages/ui/` for shared UI components
  - Create `packages/utils/` for shared utility functions
  - Create `packages/ai-tools/` for LangGraph tools implementation

#### 3. Build System Configuration
- Set up build scripts for all packages
- Configure dev server for local development
- Ensure proper TypeScript path aliases

### Phase 2: Backend Foundation & API Setup

#### 1. Backend Service Structure
- Set up Express/Node.js server in `apps/api/`
- Implement tRPC server setup
- Configure environment variables and secrets management
- Set up Supabase connection

#### 2. API Implementation
- Create API router structure with tRPC
- Implement basic CRUD operations for core entities
- Set up authentication middleware with Supabase JWT validation
- Configure Server-Sent Events (SSE) endpoint for streaming responses

#### 3. AI Service Foundation
- Set up initial LangGraph.js implementation
- Create basic agent structure with document playbook loading
- Implement tool calling infrastructure for document updates
- Configure AI request handling and response streaming

### Phase 3: Integration & Connectivity

#### 1. Frontend Integration
- Update frontend to use the new tRPC client
- Implement SSE client for AI response streaming
- Connect frontend to the newly structured backend
- Update authentication flow to work with the new API

#### 2. Shared Code Implementation
- Extract common types to `packages/types/`
- Move reusable UI components to `packages/ui/`
- Implement shared utility functions in `packages/utils/`
- Create AI tools in `packages/ai-tools/`

#### 3. Configuration & Testing
- Set up end-to-end connection testing
- Configure development workflow
- Create documentation for the new monorepo structure
- Validate the full application flow from frontend to backend AI service

## Proposed Monorepo Structure

```
innerflame/
├── .github/                # GitHub workflows and templates
├── apps/
│   ├── web/                # Frontend React application (migrated from current codebase)
│   │   ├── public/
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                # Backend API service
│       ├── src/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── services/
│       │   │   └── ai/     # AI orchestration with LangGraph
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
│       │   ├── tools/
│       │   │   ├── documentUpdate.ts
│       │   │   └── askUserQuestion.ts
│       │   └── index.ts
│       └── package.json
├── supabase/               # Supabase configuration and migrations
├── docs/                   # Project documentation
├── package.json            # Root package.json with workspaces
└── tsconfig.json           # Base TypeScript configuration
```

## Success Criteria
1. ✅ Monorepo structure is established with proper workspace configuration
2. ✅ Existing frontend application works correctly within the new structure
3. ✅ Backend service can be started and connects to Supabase
4. ✅ tRPC endpoints are accessible from the frontend
5. ✅ SSE streaming works for AI responses
6. ✅ Basic document creation and update flow is functional
7. ✅ Shared types and utilities are properly imported across packages
8. ✅ All TypeScript typing is consistent across the application

## Verification Requirements
- Frontend application continues to function as before
- Backend can successfully connect to Supabase and retrieve data
- AI responses can be streamed from backend to frontend
- Document updates via AI tools are properly processed
- Development workflow documentation is completed

## Next Steps After Milestone Completion
- Implement full AI agent orchestration with LangGraph.js
- Develop comprehensive document editing capabilities
- Create user onboarding flow and authentication
- Implement project management functionality
