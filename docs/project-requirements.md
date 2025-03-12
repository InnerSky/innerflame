# InnerFlame: Platform Requirements Specification

## 1. System Overview

InnerFlame is a universal AI-powered document creation and editing platform with real-time AI assistance. The system enables interactive document generation and refinement using configurable "agent playbooks" that define the AI's behavior and expertise domain. The application consists of:

1. **Web Frontend**: React-based interface for document editing and AI interaction
2. **API Server**: REST endpoints for data operations and authentication
3. **WebSocket AI Service**: Real-time AI assistance via WebSockets
4. **Supabase Database**: Primary data storage
5. **Firestore**: Session state management for WebSocket connections

## 2. Technical Architecture

### 2.1 System Components

```
┌───────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│                   │       │                     │       │                     │
│  React Frontend   │◄─────►│  REST API Server    │◄─────►│  Supabase Database  │
│                   │       │                     │       │                     │
└─────────┬─────────┘       └─────────────────────┘       └─────────────────────┘
          │
          │ WebSocket
          │
┌─────────▼─────────┐       ┌─────────────────────┐
│                   │       │                     │
│  AI WebSocket     │◄─────►│  Firestore          │
│  Service          │       │  Session Storage    │
│                   │       │                     │
└───────────────────┘       └─────────────────────┘
          │
          │ API Calls
          ▼
┌───────────────────┐
│                   │
│  Anthropic Claude │
│  API              │
│                   │
└───────────────────┘
```

### 2.2 Codebase Structure (Monorepo)

```
/innerflame                      # Root directory
  package.json                   # Workspace configuration
  /apps
    /web                         # Frontend application
    /api-server                  # REST API service
    /ai-service                  # WebSocket AI service
  /packages                      # Shared code
    /shared-types                # TypeScript interfaces
    /ui-components              # Shared UI library
    /database                   # Shared database access
  /playbooks                    # AI agent playbooks
    /lean-canvas                # Lean Canvas methodology
    /[future-playbooks]         # Additional playbooks to be added
```

## 3. Core Platform Capabilities

### 3.1 Document Management System

1. **Universal Document Model**
   - Generic document structure adaptable to various content types
   - Versioning system with history tracking
   - Support for rich text, structured data, and mixed content
   - Ability to extend with playbook-specific document schemas

2. **CRUD Operations**
   - Create documents from templates or scratch
   - Read optimized for various client devices
   - Update with real-time collaboration support
   - Delete with appropriate permission checks
   - Archive functionality for document lifecycle management

3. **Version Control**
   - Automatic versioning of document changes
   - Snapshot creation at meaningful intervals
   - Version comparison and rollback capabilities
   - Attribution of changes to users or AI

### 3.2 AI Agent Framework

1. **Agent Architecture**
   - Modular design supporting multiple agent types
   - Context management for maintaining conversation history
   - Tool integration for enhanced capabilities
   - Streaming thought processes for transparency

2. **Playbook System**
   - Configurable agent behaviors based on loaded playbook
   - Domain-specific knowledge and reasoning
   - Custom document templates and structures
   - Specialized interaction patterns and flows
   - First implementation: Lean Canvas Business Model Playbook

3. **Interactive Capabilities**
   - Real-time document suggestions and edits
   - Structured conversations with context awareness
   - Multiple-choice questions and guided flows
   - Progress tracking through multi-step processes
   - Visible "thinking" process similar to code agents


## 4. Data Model

### 4.1 Core Entities

**users**
- Basic user profile information
- Authentication and authorization data
- Preferences and settings

**documents**
- Core document metadata
- Ownership and access control
- Type information connecting to playbooks

**document_versions**
- Complete document snapshots
- Change tracking information
- Version metadata and significance

**messages**
- Conversation history between user and AI
- References to document changes
- Intent classification and context

### 4.2 AI Session Management

- Persistent session tracking
- State management across connections
- Reconnection handling and recovery
- Context preservation for long sessions

## 5. Key User Workflows

### 5.1 Document Creation and Editing

1. User initiates document creation with optional template
2. AI guides through document structure based on active playbook
3. Collaborative editing with real-time AI assistance
4. Version tracking with meaningful milestones
5. Exportable outputs in various formats

### 5.2 AI Interaction Patterns

1. Chat-based conversation alongside document
2. AI-proposed document changes with approval workflow
3. Guided workflows with multiple-choice options
4. Background AI analysis and suggestions
5. Transparent AI thinking processes visible to user

### 5.3 Playbook Experience

1. User selects or is guided to appropriate playbook
2. Playbook defines document structure and AI behavior
3. Domain-specific guidance based on playbook expertise
4. Customized workflows and interaction patterns
5. Specialized export formats and integration options

## 6. Technical Implementation Guidelines

### 6.1 Frontend Development

1. **Core Principles**
   - React with TypeScript for type safety
   - Component-based architecture with clear boundaries
   - Responsive design with mobile-first approach

2. **State Management**
   - Context API for global state
   - React Query for server state
   - Local component state where appropriate
   - WebSocket for real-time updates

### 6.2 Backend Development

1. **API Design**
   - RESTful endpoints for CRUD operations
   - Consistent error handling and responses
   - Comprehensive validation
   - Efficient querying with pagination

2. **WebSocket Service**
   - Stateless design with external state storage
   - Reconnection handling with graceful degradation
   - Message protocol with type safety
   - Performance optimization for real-time interactions

### 6.3 Database Strategy

1. **Supabase Configuration**
   - PostgreSQL for primary data storage
   - Row-level security for access control
   - Efficient indexing strategy
   - Type-safe access patterns

2. **Firestore Usage**
   - Session state persistence
   - WebSocket connection management
   - Ephemeral data with appropriate TTL
   - Efficient querying patterns

## 7. Security Requirements

1. **Authentication**
   - Leverage Supabase Auth directly for all authentication flows
   - JWT-based authentication with Supabase token management
   - Built-in token refresh mechanisms from Supabase
   - Session management using Supabase session APIs
   - Social login integration via Supabase OAuth providers

2. **Authorization**
   - Row-level security in database
   - Permission-based access control
   - Document sharing with granular permissions
   - API endpoint protection

3. **Data Protection**
   - Encryption at rest and in transit
   - PII handling according to regulations
   - Regular security audits
   - Compliance with relevant standards

## 8. Performance Goals

1. **Response Time Targets**
   - Page load under 1 seconds
   - API response under 500ms
   - Real-time updates under 100ms
   - AI responses initiated within 1 second

2. **Scalability Targets**
   - Support for thousands of concurrent users
   - Graceful degradation under load
   - Horizontal scaling capability
   - Resource optimization for cost efficiency

## 9. Future Expansion Areas

1. **Additional Playbooks**
   - Document templates for various domains
   - Specialized AI behaviors and knowledge bases
   - Domain-specific tools and integrations
   - Custom output formats and analysis

2. **Platform Evolution**
   - Mobile applications
   - Offline capabilities
   - Collaboration features
   - Advanced analytics and insights

---
*Last updated: March 12, 2025*