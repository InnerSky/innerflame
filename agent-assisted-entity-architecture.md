# InnerFlame: Agent-Assisted Entity Architecture

## Overview and Goals

This document outlines the architecture for InnerFlame's entity management system, which enables users to create, edit, and version-control various document types with AI mentor assistance. The system is designed to support a natural, conversation-based approach to document editing while maintaining robust versioning capabilities.

### Core Goals

1. **Natural Mentor Experience**: Support open-ended conversations between users and AI that feel like talking with a real mentor.
2. **Flexible Entity Management**: Allow any document type (canvas, press release, philosophy statement, etc.) to be referenced and modified within the same system.
3. **Comprehensive Version Control**: Provide the ability to track, visualize, and revert changes with a clear history of what changed and why.
4. **Storage Optimization**: Minimize storage requirements while maintaining version integrity.
5. **Contextual Document Evolution**: Connect document changes to the conversations that inspired them.

## Core System Architecture

### Data Model

The architecture revolves around four key concepts:

1. **Messages**: The continuous conversation between user and AI
2. **Entities**: Different document types (canvas, press release, user documents, etc.)
3. **Versions**: Historical snapshots of entity content with change metadata
4. **References**: Connections between messages and the entities they affect

### Schema Design

**1. messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  sender_type TEXT NOT NULL, -- 'user', 'ai'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Context tracking
  context_type TEXT, -- 'canvas', 'journal', 'emotional_support', 'decision_making', etc.
  context_id UUID, -- Optional reference to a specific entity (like a canvas_id)
  
  -- Intent tracking
  detected_intent TEXT[], -- ['problem_refinement', 'motivation', 'feedback', 'brainstorming']
  
  -- Action tracking
  has_proposed_changes BOOLEAN DEFAULT FALSE,
  proposed_entity_changes JSONB, -- Structured changes to any entity (Cursor-like format)
  
  -- Thread tracking (for UI organization)
  display_thread_id UUID, -- For UI to organize visually related messages
  
  -- References
  reply_to_message_id UUID REFERENCES messages(id),
  
  -- Vector embedding for semantic search
  content_embedding VECTOR(1536) -- For semantic search of conversation history
);
```

**2. message_tags**
```sql
CREATE TABLE message_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) NOT NULL,
  tag TEXT NOT NULL, -- e.g., 'canvas_update', 'emotional_support', 'decision', 'insight'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL, -- 'user', 'ai', 'system'
  UNIQUE(message_id, tag)
);
```

**3. message_references**
```sql
CREATE TABLE message_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) NOT NULL,
  entity_type TEXT NOT NULL, -- 'canvas', 'project', 'journal_entry', etc.
  entity_id UUID NOT NULL, -- The ID of the referenced entity
  reference_type TEXT NOT NULL, -- 'mentions', 'modifies', 'creates', 'analyzes'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, entity_type, entity_id, reference_type)
);
```

**4. entity_versions**
```sql
CREATE TABLE entity_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'canvas', 'journal_entry', etc.
  entity_id UUID NOT NULL, -- The ID of the entity being versioned
  version_number INTEGER NOT NULL,
  full_content JSONB, -- The full content (for major versions)
  changes JSONB, -- Context-based changes from previous version (for minor versions)
  base_version_id UUID REFERENCES entity_versions(id), -- Which version these changes apply to
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_message_id UUID REFERENCES messages(id), -- Which message created this version
  is_current BOOLEAN DEFAULT TRUE,
  version_type TEXT NOT NULL DEFAULT 'autosave', -- 'autosave', 'user_saved', 'ai_suggested'
  significance TEXT DEFAULT 'minor', -- 'minor', 'major', 'structural'
  user_label TEXT, -- Optional user-defined label for the version
  UNIQUE(entity_type, entity_id, version_number)
);
```

**5. Entity-Specific Tables (examples)**

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE canvases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  canvas_type TEXT NOT NULL DEFAULT 'lean_canvas', -- lean_canvas, fast_canvas, learner_canvas, etc.
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'philosophy', 'strategy', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}'
);
```

## Conversation-Based Version Control

Our architecture creates a continuous conversation flow between the user and AI mentor, while still providing structured document versioning:

### Key Principles

1. **Open-Ended Conversations**: No artificial boundaries - conversations flow naturally like with a real mentor
2. **Document Changes in Context**: Changes are proposed within conversation, providing rationale and context
3. **Explicit References**: Messages clearly indicate which entities they affect
4. **Bidirectional Linking**: Entities know which messages modified them; messages know which entities they modified

### Version Control Flow

1. **AI Proposes Changes**:
   - AI suggests document modifications in a message
   - Changes are stored in `proposed_entity_changes` field
   - Message is linked to entity via `message_references`

2. **User Reviews Changes**:
   - User sees highlighted changes (additions in green, deletions in red)
   - User can accept, reject, or modify the changes

3. **Changes Applied**:
   - On acceptance, a new version is created in `entity_versions`
   - Version is linked to the message that proposed it
   - Message's `has_proposed_changes` remains true but adds a reference to the created version

4. **Version Reversion**:
   - User can click on any previous message that modified an entity
   - System shows a "Revert to this version" option
   - Creating a new version with the previous content, but linked to a new "reversion" message

## Entity Management System

The system is designed to handle any entity type in a consistent way:

### Entity Type Independence

1. **Schema Agnostic**: Core versioning logic works identically regardless of entity type
2. **Dynamic References**: Messages can reference any entity type through the `entity_type` field
3. **Consistent Version Control**: All entities use the same version control mechanism

### Entity Types (Examples)

The system can support various entity types:

1. **Canvas**: Business model canvases (lean, fast, learner, etc.)
2. **Press Release**: Future press releases for vision planning
3. **Sales Page**: Landing page copy for market testing
4. **User Document**: User-created documents (philosophy statements, strategy docs, etc.)
5. **Journal Entry**: Reflective founder journal entries

### Adding New Entity Types

To add a new entity type:

1. Create a specific table for the entity (if needed)
2. Start using the new `entity_type` value in references and versions
3. No changes to core schema required

## Diff-Based Storage Optimization

To optimize storage while maintaining version integrity, the system uses a context-based diff approach inspired by code editors like Cursor:

### Storage Strategy

1. **Full Content for Major Versions**:
   - Store complete document content for milestone versions
   - Typically every X versions or user-marked significant changes

2. **Context-Based Changes for Minor Versions**:
   - Store changes with surrounding context rather than full content
   - Reference the base version these changes apply to

### Cursor-Inspired Diff Format

The system uses a context-based approach for tracking changes, similar to how code editors handle diffs:

```json
{
  "entity_type": "canvas",
  "entity_id": "canvas-123",
  "changes": [
    {
      "section": "problem",
      "context_before": "Early-stage entrepreneurs lack clarity",
      "new_content": "Early-stage entrepreneurs lack clarity and validation methods",
      "context_after": "when starting their business journey."
    },
    {
      "section": "solution",
      "context_before": "Our platform provides tools for",
      "new_content": "Our platform provides AI-guided tools for",
      "context_after": "business validation and development."
    }
  ],
  "reasoning": "Emphasizing the validation aspect of the problem and highlighting the AI capabilities in the solution."
}
```

This approach:
1. Uses surrounding text as anchors to locate changes
2. Stores only the necessary context to properly place changes
3. Includes explicit reasoning for why changes were made
4. Supports multiple changes across different sections in a single update

### Implementation in Proposed Entity Changes

When the AI suggests changes to a document, the `proposed_entity_changes` field uses this same format:

```json
{
  "entity_type": "canvas",
  "entity_id": "canvas-123",
  "changes": [
    {
      "section": "problem",
      "context_before": "Early-stage entrepreneurs lack clarity",
      "new_content": "Early-stage entrepreneurs lack clarity and validation methods",
      "context_after": "when starting their business journey."
    }
  ],
  "reasoning": "Adding validation methods emphasizes the importance of market testing."
}
```

When a user accepts these changes, the same structure is stored in the `changes` field of `entity_versions`.

### Version Reconstruction Process

To reconstruct a version:

1. Start with the nearest previous full version
2. For each change:
   - Locate the position using context_before and context_after
   - Apply the new_content at that position
3. Continue applying changes until reaching the desired version

This approach is more robust than position-based patching because it adapts to other changes that might have occurred in the document.

### Version Optimization Strategies

1. **Debounced Versions**:
   - Wait for user to stop typing (30 seconds) before creating version
   - Avoid creating versions for every keystroke

2. **Version Type Classification**:
   - Autosaves: Frequent but ephemeral (auto-pruned)
   - User-saved: Explicitly saved by user (permanent)
   - AI-suggested: Created from AI interactions (permanent)

3. **Significance-Based Retention**:
   - Minor changes: Potentially pruned over time
   - Major changes: Retained indefinitely
   - Structural changes: Always retained with full content

4. **Contextual Anchoring**:
   - Use unique surrounding text to anchor changes
   - Adapt to document evolution over time

## User Experience

The architecture enables a seamless user experience:

### Conversation Interface

- Natural chat with AI mentor
- Document editing integrated into conversation flow
- Context-aware assistance based on document content

### Change Visualization

- Inline display of proposed changes with highlighting
- Diffs showing additions (green) and removals (red) with surrounding context
- One-click acceptance of changes with clear understanding of their placement

### Version Timeline

- Visual timeline showing document evolution
- Different indicators for AI changes, user edits, and major milestones
- Ability to browse and compare any versions

### Reversion UI

- Click on previous message to see the version it created
- "Revert to this version" option
- Clear explanation of what will change

## Implementation Recommendations

### Technology Stack

1. **Database**: PostgreSQL with JSON/JSONB support
2. **Diffing Libraries**:
   - Similar to jsondiffpatch but with context-awareness
   - Custom implementation of context-based diffing for structured content

3. **UI Components**:
   - Rich text editor with change tracking
   - Timeline visualization component
   - Context-aware diff visualization component

### Performance Considerations

1. **Lazy Loading**:
   - Load only recent versions initially
   - Fetch older versions on demand

2. **Version Reconstruction**:
   - Cache commonly accessed versions
   - Precompute current and recent versions

3. **Batch Processing**:
   - Run periodic jobs to consolidate similar minor versions
   - Precompute diffs for faster access

### Anthropic API Integration

Based on implementation experience, here are key considerations for integrating with Anthropic's Claude API:

1. **API Request Format**:
   - Use the Messages API endpoint (`https://api.anthropic.com/v1/messages`)
   - Set appropriate headers: `anthropic-version`, `x-api-key`, and `content-type`
   - When including documents, use the following structure:
     ```json
     {
       "type": "document",
       "title": "Document Title",
       "source": {
         "type": "content",
         "content": "[Document content as string]"
       }
     }
     ```
   - Avoid extraneous fields like `document_id` or duplicate `content` fields

2. **Tool Definition**:
   - Define tools using the tool schema format
   - For document editing, create a `suggest_document_changes` tool with input schema matching our context-based diff format
   - Include entity type, entity ID, changes array, and reasoning as required fields

3. **Response Handling**:
   - Claude responds with a `tool_use` content type when suggesting document changes
   - Extract changes from `input.changes` array in the response
   - Process each change including section, context_before, new_content, context_after
   - Store reasoning from `input.reasoning` field

4. **Error Handling**:
   - Common errors include invalid document source format
   - API errors typically return a 400 status code with specific error details
   - Implement retry logic with appropriate backoff for transient errors
   - Parse error messages carefully to debug formatting issues

This implementation aligns with the context-based diff architecture while accommodating the specific requirements of the Anthropic API.

## Conclusion

This architecture provides a flexible, scalable foundation for InnerFlame's agent-assisted document editing system. By combining natural conversation flow with robust version control and storage optimization, the system enables a mentor-like experience while maintaining document integrity and history.

The approach can grow with the platform, accommodating new entity types and use cases without significant architectural changes. This future-proofs the system while providing immediate value for the core canvas and document editing features. 