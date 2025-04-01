-- Fix RLS policies for questionnaire_responses table
-- Migration timestamp: 2025-03-31 15:00:00

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view only their own responses" ON "public"."questionnaire_responses";
DROP POLICY IF EXISTS "Users can insert their own responses" ON "public"."questionnaire_responses";
DROP POLICY IF EXISTS "Users can update only their own responses" ON "public"."questionnaire_responses";

-- Create policies with exactly the same names and conditions
CREATE POLICY "Users can view only their own responses" 
    ON "public"."questionnaire_responses" FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" 
    ON "public"."questionnaire_responses" FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own responses" 
    ON "public"."questionnaire_responses" FOR UPDATE
    USING (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE "public"."questionnaire_responses" ENABLE ROW LEVEL SECURITY; 