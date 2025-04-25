-- Enable Row Level Security for questionnaires table
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for questionnaires table

-- All users can view active questionnaires
CREATE POLICY "All users can view active questionnaires"
ON questionnaires
FOR SELECT
USING (is_active = true);

-- Admins can view all questionnaires (including inactive ones)
CREATE POLICY "Admins can view all questionnaires"
ON questionnaires
FOR SELECT
USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Only admins can create questionnaires
CREATE POLICY "Only admins can create questionnaires"
ON questionnaires
FOR INSERT
WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Only admins can update questionnaires
CREATE POLICY "Only admins can update questionnaires"
ON questionnaires
FOR UPDATE
USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Only admins can delete questionnaires
CREATE POLICY "Only admins can delete questionnaires"
ON questionnaires
FOR DELETE
USING ((SELECT is_admin FROM users WHERE id = auth.uid())); 