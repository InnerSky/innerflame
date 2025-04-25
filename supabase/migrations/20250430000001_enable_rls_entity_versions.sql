-- Enable Row Level Security for entity_versions table
ALTER TABLE entity_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for entity_versions table

-- Users can view entity versions for entities they own
CREATE POLICY "Users can view entity versions for entities they own"
ON entity_versions
FOR SELECT
USING (entity_id IN (
  SELECT id FROM entities WHERE user_id = auth.uid()
));

-- Admins can view all entity versions
CREATE POLICY "Admins can view all entity versions"
ON entity_versions
FOR SELECT
USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Users can create entity versions for entities they own
CREATE POLICY "Users can create entity versions for entities they own"
ON entity_versions
FOR INSERT
WITH CHECK (entity_id IN (
  SELECT id FROM entities WHERE user_id = auth.uid()
));

-- Users can update entity versions for entities they own
CREATE POLICY "Users can update entity versions for entities they own"
ON entity_versions
FOR UPDATE
USING (entity_id IN (
  SELECT id FROM entities WHERE user_id = auth.uid()
));

-- Users can delete entity versions for entities they own
CREATE POLICY "Users can delete entity versions for entities they own"
ON entity_versions
FOR DELETE
USING (entity_id IN (
  SELECT id FROM entities WHERE user_id = auth.uid()
));

-- Admins can create, update, and delete all entity versions
CREATE POLICY "Admins can modify all entity versions"
ON entity_versions
FOR ALL
USING ((SELECT is_admin FROM users WHERE id = auth.uid())); 