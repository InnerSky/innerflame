# InnerFlame: Implementation Requirements Specification

## 1. System Overview

InnerFlame is an AI-powered document creation and editing platform with real-time AI assistance. The application consists of:

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
      package.json
      vite.config.ts
      /src
        /components              # UI components
        /contexts                # Context providers
        /features                # Feature modules
        /hooks                   # Custom React hooks
        /lib                     # Utilities
        /pages                   # Application pages
        
    /api-server                  # REST API service
      package.json
      Dockerfile
      /src
        /controllers             # Route handlers
        /middleware              # Request middleware
        /services                # Business logic
        /routes                  # API endpoints
        /utils                   # Utilities
        
    /ai-service                  # WebSocket AI service
      package.json
      Dockerfile
      /src
        /websocket               # WebSocket implementation
        /agents                  # LangGraph agent implementations
        /models                  # AI model configurations
        /tools                   # Agent tools (questions, editing)
        /types                   # Type definitions
        /utils                   # Utilities
        
  /packages                      # Shared code
    /shared-types                # TypeScript interfaces
      package.json
      /src
        /entities                # Entity type definitions
        /websocket               # Protocol definitions
        /ai                      # AI message types
        
    /ui-components              # Shared UI library
      package.json
      /src
        /base                    # Base components
        /composed                # Composed components
        /ai                      # AI-specific components
        
    /database                   # Shared database access
      package.json
      /src
        /repositories            # Data access
        /models                  # Entity models
        /utils                   # Database utilities
```

## 3. Technical Stack Implementation

### 3.1 Frontend Implementation

| Component | Technology | Implementation Details |
|-----------|------------|-------------------------|
| Framework | React 18   | Use functional components with hooks |
| Build Tool | Vite | Configure for TypeScript and ESM |
| Styling | Tailwind CSS | Use custom configuration with Radix UI integration |
| State Management | Context API | Create context providers for auth, entities, and AI state |
| Routing | React Router v6 | Implement protected routes for authentication |
| WebSocket | Custom client | Build with reconnection logic and timeout handling |
| File Structure | Feature-based | Organize by domain feature rather than technical type |

### 3.2 API Server Implementation

| Component | Technology | Implementation Details |
|-----------|------------|-------------------------|
| Runtime | Node.js 18+ | Use ESM modules exclusively |
| Framework | Express | Implement middleware-based architecture |
| Authentication | Supabase Auth | Validate JWT tokens in middleware |
| Database Access | Supabase SDK | Use typed repositories pattern |
| Validation | Zod | Validate request payloads with schema |
| Error Handling | Structured errors | Implement consistent error response format |

### 3.3 AI Service Implementation

| Component | Technology | Implementation Details |
|-----------|------------|-------------------------|
| Runtime | Node.js 18+ | Configure for ESM modules |
| WebSocket | ws library | Implement with connection tracking |
| AI Framework | LangGraph.js | Build typed agent definitions |
| State Storage | Firestore | Implement session persistence |
| Authentication | JWT validation | Verify tokens from request headers |
| Streaming | Binary chunks | Use binary protocol for performance |

### 3.4 Shared Libraries Implementation

| Package | Purpose | Implementation Details |
|---------|---------|-------------------------|
| shared-types | Type definitions | Export interfaces with documentation |
| ui-components | UI component library | Build accessible components with Radix |
| database | Data access layer | Implement repository pattern with types |

## 4. Data Model Implementation

### 4.1 Database Schema

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**entities**
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  entity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**entity_versions**
```sql
CREATE TABLE entity_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  full_content JSONB,
  changes JSONB,
  base_version_id UUID REFERENCES entity_versions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_message_id UUID REFERENCES messages(id),
  is_current BOOLEAN DEFAULT TRUE,
  version_type TEXT NOT NULL DEFAULT 'autosave',
  significance TEXT DEFAULT 'minor',
  user_label TEXT,
  UNIQUE(entity_type, entity_id, version_number)
);
```

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  context_type TEXT,
  context_id UUID,
  detected_intent TEXT[],
  has_proposed_changes BOOLEAN DEFAULT FALSE,
  proposed_entity_changes JSONB,
  display_thread_id UUID,
  reply_to_message_id UUID REFERENCES messages(id),
  content_embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**message_references**
```sql
CREATE TABLE message_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reference_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, entity_type, entity_id, reference_type)
);
```

### 4.2 Indexes Implementation

```sql
-- Entity indexes
CREATE INDEX entities_user_id_idx ON entities(user_id);
CREATE INDEX entities_entity_type_idx ON entities(entity_type);

-- Version indexes
CREATE INDEX entity_versions_entity_id_idx ON entity_versions(entity_id);
CREATE INDEX entity_versions_is_current_idx ON entity_versions(entity_id, is_current);

-- Message indexes
CREATE INDEX messages_user_id_idx ON messages(user_id);
CREATE INDEX messages_reply_to_message_id_idx ON messages(reply_to_message_id);
CREATE INDEX messages_display_thread_id_idx ON messages(display_thread_id);
CREATE INDEX messages_context_idx ON messages(context_type, context_id);
CREATE INDEX messages_content_embedding_idx ON messages USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

-- Reference indexes
CREATE INDEX message_references_entity_idx ON message_references(entity_type, entity_id);
CREATE INDEX message_references_message_id_idx ON message_references(message_id);
```

### 4.3 Firestore Schema

**Sessions Collection**
```javascript
{
  sessionId: string,           // Unique session identifier
  userId: string,              // Associated user ID
  createdAt: timestamp,        // Session creation time
  lastActive: timestamp,       // Last activity timestamp
  state: {                     // Current agent state
    messages: Array,           // Conversation history
    entityContext: Object,     // Entity being worked on
    currentTool: string,       // Active tool if any
    thinking: string,          // Current thinking trace
    status: string             // Session status
  },
  metadata: {                  // Additional session metadata
    clientInfo: Object,        // Client information
    reconnectCount: number     // Number of reconnections
  }
}
```

## 5. Feature Implementation

### 5.1 Authentication Flow

1. **Login Flow**:
   - User enters credentials on login form
   - Frontend calls Supabase Auth API
   - On success, JWT token stored in localStorage
   - User redirected to dashboard

2. **Authenticated Requests**:
   - REST API: JWT token sent in Authorization header
   - WebSocket: Token sent in connection query parameter or header
   - Both services validate token with Supabase JWT verification

3. **Session Renewal**:
   - Implement token refresh before expiration
   - Handle reauthentication on token invalidation

### 5.2 Document Creation Flow

1. **New Document Creation**:
   - User selects document type
   - Frontend creates entity record via API
   - Initial version created with empty content
   - User redirected to editor with new document

2. **Document Loading**:
   - Load entity and current version data
   - Populate editor with content
   - Fetch related messages for context

3. **Document Saving**:
   - Autosave on content changes (debounced)
   - Create new version records on significant changes
   - Track version history with metadata

### 5.3 AI Assistance Flow

1. **Conversation Initialization**:
   - User opens document and activates AI
   - WebSocket connection established with auth
   - Session created/retrieved in Firestore
   - Connection ID and session info sent to client

2. **User Message Handling**:
   - User sends message via WebSocket
   - Message persisted to database
   - AI service processes with LangGraph
   - Thinking stream sent in real-time
   - Final response sent and persisted

3. **Document Editing**:
   - AI proposes changes with diff format
   - User reviews proposed changes
   - On acceptance, changes applied to document
   - New version created with reference to message
   - Version history updated

4. **Planned Reconnection**:
   - Client tracks connection time
   - At 55 minutes, initiate planned reconnection
   - Maintain session state through Firestore
   - Resume conversation with context

### 5.4 Version Control Implementation

1. **Version Tracking**:
   - Major versions: Complete document snapshots
   - Minor versions: Diff-based changes
   - Each version linked to creating message
   - Metadata includes version significance

2. **Diff Visualization**:
   - Calculate diffs between versions
   - Display using highlighted additions/removals
   - Side-by-side comparison view
   - One-click reversion to previous versions

## 6. WebSocket Implementation

### 6.1 Protocol Definition

**Connection Establishment**
```typescript
interface ConnectMessage {
  type: 'connect';
  token: string;
  sessionId?: string;
  clientInfo: {
    userAgent: string;
    deviceType: string;
  };
}

interface ConnectAckMessage {
  type: 'connect_ack';
  sessionId: string;
  userId: string;
  serverTime: string;
}
```

**User Messages**
```typescript
interface UserMessage {
  type: 'user_message';
  messageId: string;
  sessionId: string;
  content: string;
  entityContext?: {
    entityId: string;
    entityType: string;
    versionId: string;
  };
}
```

**AI Responses**
```typescript
interface ThinkingMessage {
  type: 'ai_thinking';
  sessionId: string;
  messageId: string;
  content: string;
  isComplete: boolean;
}

interface AIResponseMessage {
  type: 'ai_response';
  sessionId: string;
  messageId: string;
  content: string;
  referencedMessages: string[];
}

interface AIEditProposalMessage {
  type: 'ai_edit_proposal';
  sessionId: string;
  messageId: string;
  entityId: string;
  baseVersionId: string;
  changes: {
    insertions: Array<{position: number, content: string}>;
    deletions: Array<{start: number, end: number}>;
    replacements: Array<{start: number, end: number, content: string}>;
  };
  reasoning: string;
}
```

### 6.2 Connection Management

1. **Authentication**:
   - Validate JWT token on connection
   - Extract user ID and permissions
   - Associate connection with user

2. **Session Tracking**:
   - Generate or retrieve session ID
   - Store session state in Firestore
   - Track active connections per session

3. **Heartbeat**:
   - Send ping every 30 seconds
   - Close connection if pong not received
   - Track last activity timestamp

4. **Reconnection**:
   - Client implements exponential backoff
   - Session resumption with session ID
   - State recovery from Firestore

5. **Planned Reconnection**:
   - Initiate at 55 minutes (before 60-minute limit)
   - Client connects with existing session ID
   - Server validates and restores conversation context

## 7. AI Implementation

### 7.1 Agent Structure

1. **Agent Types**:
   - Canvas Strategy Agent: High-level document planning
   - Section Writer Agent: Detailed content creation
   - Editor Agent: Refinement and improvements
   - Supervisor Agent: Orchestration and context management

2. **Agent Tools**:
   - Question Tool: Ask user for input with options
   - Edit Tool: Generate document changes
   - Research Tool: Search knowledge base
   - Reflect Tool: Analyze document structure

### 7.2 LangGraph Implementation

1. **Graph Structure**:
   - Define nodes for thinking, questioning, editing
   - Connect nodes with typed edges
   - Implement state transitions

2. **State Management**:
   - Use TypeScript interfaces for state
   - Track conversation history in state
   - Persist state changes to Firestore

3. **Claude API Integration**:
   - Implement streaming response handling
   - Parse Claude output for tool calls
   - Manage token usage and rate limits

## 8. Deployment Implementation

### 8.1 Google Cloud Run Setup

1. **Container Configuration**:
   - Build optimized Docker images
   - Configure memory and CPU allocation
   - Set environment variables for services

2. **Deployment Commands**:
   ```bash
   # Build and deploy API server
   gcloud builds submit --tag gcr.io/innerflame/api-server ./apps/api-server
   gcloud run deploy api-server --image gcr.io/innerflame/api-server \
     --platform managed --region us-central1 --allow-unauthenticated
     
   # Build and deploy AI service
   gcloud builds submit --tag gcr.io/innerflame/ai-service ./apps/ai-service
   gcloud run deploy ai-service --image gcr.io/innerflame/ai-service \
     --platform managed --region us-central1 --allow-unauthenticated \
     --memory 2Gi --cpu 2 --timeout 3600
   ```

3. **Environment Configuration**:
   - Store secrets in Secret Manager
   - Configure environment variables
   - Set connection limits and timeouts

### 8.2 WebSocket Configuration

1. **Timeouts and Limits**:
   - Set max concurrent connections
   - Configure 60-minute request timeout
   - Implement connection tracking

2. **Cold Start Optimization**:
   - Minimize container size
   - Optimize dependency loading
   - Implement strategic background warming
   - Set minimum instance count

### 8.3 Frontend Deployment

1. **Build Process**:
   ```bash
   # Build frontend
   cd apps/web
   npm run build
   
   # Deploy to hosting
   gcloud storage cp dist/* gs://innerflame-web/
   ```

2. **CDN Configuration**:
   - Set up Cloud CDN for static assets
   - Configure caching headers
   - Enable compression

## 9. Security Implementation

### 9.1 Authentication Implementation

1. **JWT Validation**:
   ```typescript
   // Middleware implementation
   const authMiddleware = async (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });
     
     try {
       const { data, error } = await supabase.auth.getUser(token);
       if (error) throw error;
       req.user = data.user;
       next();
     } catch (error) {
       return res.status(401).json({ error: 'Invalid token' });
     }
   };
   ```

2. **WebSocket Authentication**:
   ```typescript
   // WebSocket auth implementation
   const verifyToken = async (token) => {
     try {
       const { data, error } = await supabase.auth.getUser(token);
       if (error) throw error;
       return { authenticated: true, user: data.user };
     } catch (error) {
       return { authenticated: false, error: error.message };
     }
   };
   
   wss.on('connection', async (ws, req) => {
     const token = extractTokenFromRequest(req);
     const authResult = await verifyToken(token);
     
     if (!authResult.authenticated) {
       ws.close(1008, 'Authentication failed');
       return;
     }
     
     // Continue with authenticated connection
   });
   ```

### 9.2 Database Security

1. **Row-Level Security**:
   ```sql
   -- Implement RLS on entities table
   ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
   
   -- Only allow users to see their own entities
   CREATE POLICY entities_select_policy ON entities
     FOR SELECT USING (user_id = auth.uid());
     
   -- Only allow users to insert their own entities
   CREATE POLICY entities_insert_policy ON entities
     FOR INSERT WITH CHECK (user_id = auth.uid());
     
   -- Only allow users to update their own entities
   CREATE POLICY entities_update_policy ON entities
     FOR UPDATE USING (user_id = auth.uid());
   ```

2. **API Validation**:
   ```typescript
   // Zod schema for entity creation
   const entitySchema = z.object({
     title: z.string().min(1).max(100),
     entity_type: z.string().min(1),
     content: z.string().optional(),
     metadata: z.record(z.any()).optional()
   });
   
   // Validation middleware
   const validateEntity = (req, res, next) => {
     const result = entitySchema.safeParse(req.body);
     if (!result.success) {
       return res.status(400).json({ 
         error: 'Invalid data', 
         details: result.error.format() 
       });
     }
     req.validatedData = result.data;
     next();
   };
   ```

## 10. Performance Optimization

### 10.1 Frontend Optimizations

1. **Bundle Optimization**:
   - Enable code splitting
   - Implement dynamic imports
   - Optimize asset loading
   - Implement lazy loading for routes

2. **Rendering Optimization**:
   - Use React.memo for expensive components
   - Implement virtualization for large lists
   - Optimize re-renders with useMemo/useCallback

### 10.2 Database Optimizations

1. **Query Optimization**:
   - Use appropriate indexes
   - Implement pagination
   - Optimize JOIN operations
   - Use materialized views for complex aggregations

2. **Connection Management**:
   - Use connection pooling
   - Implement query timeouts
   - Monitor slow queries

### 10.3 WebSocket Optimizations

1. **Message Optimization**:
   - Implement binary protocol
   - Compress message payloads
   - Batch small updates
   - Throttle high-frequency events

2. **State Management**:
   - Minimize Firestore document size
   - Use sub-collections for large arrays
   - Implement efficient query patterns

## 11. Testing Requirements

### 11.1 Unit Testing Implementation

```typescript
// Example test for entity repository
describe('EntityRepository', () => {
  beforeEach(() => {
    // Setup test database
  });
  
  test('should create new entity with valid data', async () => {
    const repo = new EntityRepository();
    const entity = await repo.create({
      user_id: 'test-user',
      title: 'Test Entity',
      entity_type: 'canvas',
    });
    
    expect(entity).toHaveProperty('id');
    expect(entity.title).toBe('Test Entity');
  });
});
```

### 11.2 Integration Testing Implementation

```typescript
// Example integration test for API
describe('Entity API', () => {
  let token;
  
  beforeAll(async () => {
    // Authenticate and get token
  });
  
  test('should create entity via API', async () => {
    const response = await request(app)
      .post('/api/entities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Entity',
        entity_type: 'canvas',
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### 11.3 WebSocket Testing Implementation

```typescript
// Example WebSocket client test
describe('WebSocket Client', () => {
  let client;
  let mockServer;
  
  beforeEach(() => {
    mockServer = new MockWebSocket.Server();
    client = new WebSocketClient({
      url: 'ws://localhost:8080',
      token: 'test-token'
    });
  });
  
  test('should reconnect after disconnection', async () => {
    await client.connect();
    expect(client.isConnected()).toBe(true);
    
    mockServer.disconnect();
    await wait(100);
    expect(client.isConnected()).toBe(false);
    
    await wait(1000); // Wait for reconnect
    expect(client.isConnected()).toBe(true);
  });
});
```

## 12. Conclusion

This implementation specification provides comprehensive guidance for developing the InnerFlame platform with its AI-powered document creation capabilities. By following these detailed requirements, the development team can build a robust, scalable, and maintainable application that fulfills all the functional and technical requirements.

The specification emphasizes:

1. Clear architectural boundaries between system components
2. Type-safe implementation with TypeScript throughout
3. Real-time WebSocket communication with Google Cloud Run
4. Stateful session management with Firestore
5. Comprehensive data model with version control
6. Secure authentication and authorization
7. Performance optimizations at all levels

Engineers should reference this document for implementation details while maintaining flexibility to solve specific technical challenges as they arise. 