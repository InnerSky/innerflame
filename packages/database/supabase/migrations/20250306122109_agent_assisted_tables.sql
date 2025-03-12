-- Migration: Agent-Assisted Entity Architecture Tables
-- Description: Creates the tables needed for the conversation-based version control system

-- Enable the vector extension for embedding support
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create messages table (referenced by other tables)
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

-- Create indices for common message queries
CREATE INDEX messages_user_id_idx ON messages(user_id);
CREATE INDEX messages_context_id_idx ON messages(context_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
CREATE INDEX messages_display_thread_id_idx ON messages(display_thread_id);
CREATE INDEX messages_reply_to_message_id_idx ON messages(reply_to_message_id);

-- 2. Create entity_versions table (has self-reference)
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

-- Create indices for entity_versions
CREATE INDEX entity_versions_entity_id_idx ON entity_versions(entity_id);
CREATE INDEX entity_versions_entity_type_idx ON entity_versions(entity_type);
CREATE INDEX entity_versions_is_current_idx ON entity_versions(is_current);
CREATE INDEX entity_versions_created_by_message_id_idx ON entity_versions(created_by_message_id);
CREATE INDEX entity_versions_base_version_id_idx ON entity_versions(base_version_id);

-- 3. Create message_tags table
CREATE TABLE message_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) NOT NULL,
  tag TEXT NOT NULL, -- e.g., 'canvas_update', 'emotional_support', 'decision', 'insight'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL, -- 'user', 'ai', 'system'
  UNIQUE(message_id, tag)
);

-- Create indices for message_tags
CREATE INDEX message_tags_message_id_idx ON message_tags(message_id);
CREATE INDEX message_tags_tag_idx ON message_tags(tag);

-- 4. Create message_references table
CREATE TABLE message_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) NOT NULL,
  entity_type TEXT NOT NULL, -- 'canvas', 'project', 'journal_entry', etc.
  entity_id UUID NOT NULL, -- The ID of the referenced entity
  reference_type TEXT NOT NULL, -- 'mentions', 'modifies', 'creates', 'analyzes'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, entity_type, entity_id, reference_type)
);

-- Create indices for message_references
CREATE INDEX message_references_message_id_idx ON message_references(message_id);
CREATE INDEX message_references_entity_id_idx ON message_references(entity_id);
CREATE INDEX message_references_entity_type_idx ON message_references(entity_type);
CREATE INDEX message_references_reference_type_idx ON message_references(reference_type);

-- We don't enforce FK constraint since entity_type is not always entities table
-- AND we expect referential integrity to be handled at the application level
-- ALTER TABLE message_references ADD CONSTRAINT fk_message_references_entity_id 
--   FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE;

-- ALTER TABLE entity_versions ADD CONSTRAINT fk_entity_versions_entity_id 
--   FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE; 