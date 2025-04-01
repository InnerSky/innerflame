-- Rename user_questionnaire_responses table to questionnaire_responses
-- Migration timestamp: 2025-03-31 14:01:23

-- Step 1: Rename the table
ALTER TABLE "public"."user_questionnaire_responses" RENAME TO "questionnaire_responses";

-- Step 2: Rename the indexes
ALTER INDEX "user_questionnaire_responses_user_questionnaire_idx" RENAME TO "questionnaire_responses_user_questionnaire_idx";
ALTER INDEX "user_questionnaire_responses_user_status_idx" RENAME TO "questionnaire_responses_user_status_idx";
ALTER INDEX "user_questionnaire_responses_questionnaire_id_idx" RENAME TO "questionnaire_responses_questionnaire_id_idx";

-- Step 3: Rename the foreign key constraints
ALTER TABLE "public"."questionnaire_responses" RENAME CONSTRAINT "user_questionnaire_responses_user_id_fkey" TO "questionnaire_responses_user_id_fkey";
ALTER TABLE "public"."questionnaire_responses" RENAME CONSTRAINT "user_questionnaire_responses_questionnaire_id_fkey" TO "questionnaire_responses_questionnaire_id_fkey";

-- Step 4: Update the comment on the table
COMMENT ON TABLE "public"."questionnaire_responses" IS 'Stores user progress and answers for questionnaires';

-- Step 5: Recreate RLS policies with new table name
DROP POLICY IF EXISTS "Users can view only their own responses" ON "public"."questionnaire_responses";
DROP POLICY IF EXISTS "Users can insert their own responses" ON "public"."questionnaire_responses";
DROP POLICY IF EXISTS "Users can update only their own responses" ON "public"."questionnaire_responses";

CREATE POLICY "Users can view only their own responses" 
    ON "public"."questionnaire_responses" FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" 
    ON "public"."questionnaire_responses" FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own responses" 
    ON "public"."questionnaire_responses" FOR UPDATE
    USING (auth.uid() = user_id);

-- Step 6: Recreate trigger with new table name
DROP TRIGGER IF EXISTS handle_updated_at_user_questionnaire_responses ON "public"."questionnaire_responses";

CREATE TRIGGER handle_updated_at_questionnaire_responses
  BEFORE UPDATE ON public.questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 