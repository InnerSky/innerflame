# Project Description

## Overview
InnerFlame is here to "ignite the passion" in entrepreneurs by serving as a strategic thinking partner designed to help inexperienced entrepreneurs make quality business decisions without extensive prior learning. The application provides guided document creation with context-aware agent assistance, enabling users to develop business strategy, marketing, and iteration processes while learning on the job. Using a unified chat interface connected to specialized AI agents, the platform simplifies complex business documentation through step-by-step guidance and context-aware support.

## Core Functionality
*The following specifications serve as a starting point and foundation but are not limitations. They may evolve and expand as development progresses.*

### Primary Purpose
This application allows users to create professional business strategy documents with AI guidance while learning business fundamentals.
- Create and manage structured business documents with specialized AI assistance
- Engage with context-aware AI agents that provide strategic guidance and explanations
- Track document versions and iterate on business ideas with expert support

### Key User Journeys
1. **First-time founder** wants to **create a validated business model**:

   - **Step 1:** 
     - *User Experience:* Enter business idea in the "Type your business idea here..." field on landing page and press "Generate Canvas"
     - *Technical Implementation:* System creates a new Project entity with default name "New Project" and a Document entity with document_type "lean_canvas" and data_type "json" in the database. User is immediately redirected to the collaboration interface where their idea is automatically formatted as "My idea is..." and saved as a Message with context_tag referencing the new Document.id. An API call is made to Claude with lean_canvas_playbook loaded as the system prompt along with the user's message. Claude's response includes a special `<update_document>` tag containing JSON for updating document fields, which signals the backend to process and update the document in Supabase.

   - **Step 4:** 
     - *User Experience:* Complete a brief onboarding questionnaire with multiple-choice options about needs, team size, and project timeline
     - *Technical Implementation:* System creates a User entity or authenticates existing user, links the temporary Project and Document to the User.id, and stores responses in UserPreference collection

   - **Step 5:** 
     - *User Experience:* Enter the guided workspace featuring a dual-panel interface with chat on one side and the Lean Canvas document on the other
     - *Technical Implementation:* Application loads Document.content from the database and initializes the chat interface with the Document.id as the contextual anchor

   - **Step 6:** 
     - *User Experience:* Interact with Mentor AI through a chat interface that provides guidance and suggestions in real-time
     - *Technical Implementation:* System uses LangGraph for agent orchestration, loads lean_canvas_playbook.md as context, and streams responses through Server-Sent Events (SSE) protocol (not WebSockets). Messages are stored in the Message collection with document_id as the context tag

   - **Step 7:** 
     - *User Experience:* Work through each canvas section sequentially, selecting from AI-suggested options or providing custom input
     - *Technical Implementation:* Each user selection triggers a Message entity creation and an agent response. The agent uses DocumentUpdate tool calls to modify specific sections of the Document.content JSON structure

   - **Step 8:** 
     - *User Experience:* Complete the full Lean Canvas with personalized, refined content
     - *Technical Implementation:* Final Document version is saved with Document.status updated to "completed" and Document.version incremented. All sections in Document.content are populated with user-approved content

   - **Result:** A structured business model document that clarifies the founder's vision and provides actionable direction

### Unique Value Proposition
_What makes this application different or better than existing solutions?_
- Combines document editing with specialized AI strategic guidance in one interface
- Provides "why" explanations behind business recommendations, enhancing learning
- Removes barriers to quality business planning for those without formal business education
- Implements context-awareness across all user documents for cohesive strategy development

## Data Schema
*The following schema elements provide a starting framework and are expected to evolve as the project develops. Additional entities and relationships may be added as needed.*

### Key Tables/Collections
- **users**: Authentication details and profile information for platform access
- **projects**: Container entity that groups related documents with name, description, and ownership details
- **documents**: Contains document_type (lean_canvas, future_press_conference, sales_page, etc.), metadata, and references to document versions
- **document_versions**: Actual storage of document content with data_type (json, html, markdown), version number, and timestamp
- **messages**: Communication records between users and agents with content and context_tags (connecting messages to either a project_id or document_id)


### Relationships
- users to projects: 1:N - One user can own multiple projects
- projects to documents: 1:N - A project can contain multiple documents, but documents can also exist independently
- projects to messages: 1:N - Messages can belong to a project without referencing a document, or exist without any context association
- documents to messages: 1:N - Messages can reference specific documents for context, but can also exist without document association

### Special Considerations
- Document content stored as json, html, or markdown based on how it should be previewed
- Context tagging system implemented to display relevant messages based on location (project, document, or global view)

## Technology Stack

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **UI Component Library**: shadcn UI with customized theme
- **Design System**:
  - Style: Modern, clean Glassmorphism with fire moving behind frosted glass
  - Color Scheme: Gradient from orange to purple-pink
  - Responsive Strategy: Mobile-first PWA design
- **State Management**: React's built-in state hooks with server-driven state via tRPC and SSE

### Backend
- **Framework**: Custom Agentic Framework
- **Language**: TypeScript (unified with frontend for improved maintainability)
- **AI Integration**: Custom agent implementation with TypeScript
- **API Architecture**: Server-side Orchestration Layer with tRPC + SSE, including:
  - **Data Operations**: tRPC for type-safe CRUD operations on Supabase database tables
  - **AI Orchestration**: Custom agent framework that implements two primary tools: 1) editDocument and 2) askUserQuestion. For editDocument, tool calls are intercepted by our server, executed, and immediately acknowledged as successful to ensure Claude continues streaming text without interruption. For askUserQuestion, the streaming stops at the question, conversation state is saved in the database, and a new streaming session begins when the user provides an answer
  - **Streaming Protocol**: Server-Sent Events (SSE) for real-time AI response streaming
  - **Tool Implementation**: Server-side interception and execution of Claude API tool calls
  - **Authentication**: JWT token validation via Supabase Auth middleware

### Infrastructure
- **Authentication**: Supabase Auth with Google Auth integration
- **Database**: Supabase
- **Storage**: Supabase Storage
  - **Hosting/Deployment**:
  - Frontend: Netlify
  - Backend: Google Cloud Run