-- Enable Row Level Security for entities table
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for entities table

-- Users can view their own entities
CREATE POLICY "Users can view their own entities"
ON entities
FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all entities
CREATE POLICY "Admins can view all entities"
ON entities
FOR SELECT
USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Users can create entities
CREATE POLICY "Users can create entities"
ON entities
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own entities
CREATE POLICY "Users can update their own entities"
ON entities
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own entities
CREATE POLICY "Users can delete their own entities"
ON entities
FOR DELETE
USING (user_id = auth.uid());

-- Admins can create, update, and delete all entities
CREATE POLICY "Admins can modify all entities"
ON entities
FOR ALL
USING ((SELECT is_admin FROM users WHERE id = auth.uid())); 