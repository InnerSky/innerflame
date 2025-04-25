-- Enable Row Level Security for message_references table
ALTER TABLE message_references ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for message_references table

-- Users can view message references related to their own messages
CREATE POLICY "Users can view message references related to their messages"
ON message_references
FOR SELECT
USING (message_id IN (
  SELECT id FROM messages WHERE user_id = auth.uid()
));

-- Users can view message references for entities they own
CREATE POLICY "Users can view message references for their entities"
ON message_references
FOR SELECT
USING (entity_type = 'entity' AND entity_id IN (
  SELECT id FROM entities WHERE user_id = auth.uid()
));

-- Admins can view all message references
CREATE POLICY "Admins can view all message references"
ON message_references
FOR SELECT
USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Users can create message references for their own messages
CREATE POLICY "Users can create message references for their messages"
ON message_references
FOR INSERT
WITH CHECK (message_id IN (
  SELECT id FROM messages WHERE user_id = auth.uid()
));

-- Users can delete message references for their own messages
CREATE POLICY "Users can delete message references for their messages"
ON message_references
FOR DELETE
USING (message_id IN (
  SELECT id FROM messages WHERE user_id = auth.uid()
));

-- Admins can create, update, and delete all message references
CREATE POLICY "Admins can modify all message references"
ON message_references
FOR ALL
USING ((SELECT is_admin FROM users WHERE id = auth.uid())); 