# InnerFlame Codebase Overview

This document provides an overview of the existing codebase structure and implemented components for the InnerFlame platform.

## Project Structure

InnerFlame follows a monorepo architecture using Turborepo with the following main directories:

```
/innerflame
├── apps/                    # Application implementations
│   ├── web/                 # Main React web application
│   ├── ai-service/          # WebSocket AI service
│   ├── api-server/          # API server
│   ├── admin-portal/        # Admin interface (placeholder)
│   ├── analytics-service/   # Analytics service (placeholder)
│   └── mobile/              # Mobile app (placeholder)
├── packages/                # Shared libraries and utilities
├── docs/                    # Project documentation
└── scripts/                 # Build and utility scripts
```

## Web Application (/apps/web)

The web application is built with React, TypeScript, and Tailwind CSS, following a feature-based architecture.

### Key Directories

```
/apps/web/src
├── components/              # Shared UI components
│   ├── ui/                  # Base UI component library
│   ├── auth/                # Authentication components
│   └── founders-lab/        # Founder's lab specific components
├── contexts/                # React context providers
├── features/                # Feature-specific code
│   └── documents/           # Document management feature
├── hooks/                   # Shared React hooks
├── lib/                     # Utility libraries and integrations
├── pages/                   # Application pages/routes
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions
```

### Main Pages

| Page | Description | Implementation Status |
|------|-------------|------------------------|
| `Home.tsx` | Landing page | Implemented |
| `UserDocuments.tsx` | Document management | Implemented |
| `FoundersLab.tsx` | Founder's laboratory | Partial |
| `Settings.tsx` | User settings | Implemented |
| `Admin.tsx` | Admin controls | Implemented |
| `Articles.tsx` | Content/articles | Implemented |

### Core Features

#### Document Management

The document management system is the most developed feature with:

- **Document CRUD Operations**: Create, view, edit, and delete documents
- **Version History**: Track document versions with change metadata
- **Project Organization**: Group documents into projects
- **Search and Filtering**: Find documents by title, content, and filters

**Key Components:**
- `DocumentList`: Displays user documents with search/filter options
- `DocumentEditor`: Content editing interface
- `VersionHistoryModal`: View and manage document versions

**Implementation Details:**
- Data is stored in Supabase using the `entities` and `entity_versions` tables
- Documents are stored as markdown with metadata
- Version history tracks changes between document iterations

#### Authentication

Authentication is implemented using Supabase Auth with:

- Email/password authentication flow
- Social login integration (setup in progress)
- User profile management
- Session handling and persistence

**Key Components:**
- `AuthModal`: Login and registration interface
- `UserMenu`: User account controls and navigation
- `AuthContext`: Authentication state and methods

#### UI Components

The application includes a comprehensive UI component library built on:

- Shadcn UI component patterns
- Tailwind CSS for styling
- Custom theme system with light/dark mode

**Key Components:**
- Form elements (Button, Input, Textarea)
- Layout components (Card, Dialog, DropdownMenu)
- Feedback components (Alert, Toast)
- Navigation elements (Tabs, Separator)

## Integration Points

### Supabase Integration

The application uses Supabase for:

- **Authentication**: User management and session handling
- **Database**: PostgreSQL-based document storage
- **Storage**: File uploads and media management

Implementation in `/src/lib/supabase.ts`

### WebSocket Connection

Initial setup for WebSocket communication with the AI service is present:

- Connection management utilities
- Message handling infrastructure
- Authentication flow with the WebSocket service

## Development Status

Based on the existing codebase and the roadmap, the application is currently in Phase 1-2 of development:

### Completed Features

- ✅ Monorepo structure with Turborepo
- ✅ Basic document management system
- ✅ User authentication via Supabase
- ✅ Core UI component library
- ✅ Document versioning system

### In Progress Features

- 🚧 Project organization for documents
- 🚧 Basic AI integration infrastructure
- 🚧 Founder's lab initial implementation

### Pending Features

- 📝 Real-time collaboration
- 📝 WebSocket AI agent integration
- 📝 Playbook system implementation
- 📝 Advanced document templates

## Next Steps for Implementation

Based on the existing code and the project roadmap, the logical next steps are:

1. Complete the WebSocket service infrastructure for agent communication
2. Implement the core AI agent framework with Claude API integration
3. Develop the agent tools system for document interaction
4. Create the playbook loading and configuration mechanism
5. Implement the side-by-side document editing with AI interface

## Technical Considerations

- The application uses React context for state management
- Supabase handles authentication and data persistence
- The UI follows a component-based architecture with Tailwind CSS
- The codebase is organized by feature for better separation of concerns
- TypeScript is used throughout for type safety

---

This overview provides a starting point for understanding the current state of the InnerFlame platform. The codebase is already structured following the technical design decisions outlined in the project documentation, with a focus on a monorepo architecture, React with TypeScript, and Supabase for backend services.
