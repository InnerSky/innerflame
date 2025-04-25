-- Enable Row Level Security for message_tags table
ALTER TABLE message_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for message_tags table

-- Users can view tags for their own messages
CREATE POLICY "Users can view tags for their own messages"
ON message_tags
FOR SELECT
USING (message_id IN (
  SELECT id FROM messages WHERE user_id = auth.uid()
));

-- Admins can view all message tags
CREATE POLICY "Admins can view all message tags"
ON message_tags
FOR SELECT
USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Users can create tags for their own messages
CREATE POLICY "Users can create tags for their own messages"
ON message_tags
FOR INSERT
WITH CHECK (message_id IN (
  SELECT id FROM messages WHERE user_id = auth.uid()
));

-- Users can delete tags for their own messages
CREATE POLICY "Users can delete tags for their own messages"
ON message_tags
FOR DELETE
USING (message_id IN (
  SELECT id FROM messages WHERE user_id = auth.uid()
));

-- Users can update tags they created
CREATE POLICY "Users can update tags they created"
ON message_tags
FOR UPDATE
USING (created_by::uuid = auth.uid());

-- Admins can create, update, and delete all message tags
CREATE POLICY "Admins can modify all message tags"
ON message_tags
FOR ALL
USING ((SELECT is_admin FROM users WHERE id = auth.uid())); 