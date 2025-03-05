-- Create a generic entities table that can store different document types
-- This includes Canvas, Future Press Conference, User Document, etc.
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- Document content
  entity_type TEXT NOT NULL, -- 'canvas', 'future_press_conference', 'user_document', etc.
  metadata JSONB DEFAULT '{}', -- For storing type-specific extra data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on entity_type for faster filtering
CREATE INDEX entities_entity_type_idx ON entities(entity_type);

-- Create an index on user_id for faster user-specific queries
CREATE INDEX entities_user_id_idx ON entities(user_id); 