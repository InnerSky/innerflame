-- Create questionnaire tables for InnerFlame application
-- Migration timestamp: 2024-05-08 00:00:00

-- ===================================================
-- Table: questionnaires
-- ===================================================
CREATE TABLE IF NOT EXISTS "public"."questionnaires" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "structure" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indices for questionnaires table
CREATE UNIQUE INDEX IF NOT EXISTS "questionnaires_type_version_idx" ON "public"."questionnaires" ("type", "version");
CREATE INDEX IF NOT EXISTS "questionnaires_type_is_active_idx" ON "public"."questionnaires" ("type", "is_active");

-- Comment on table
COMMENT ON TABLE "public"."questionnaires" IS 'Stores the definitions and metadata for different versions of questionnaires';

-- ===================================================
-- Table: user_questionnaire_responses
-- ===================================================
CREATE TABLE IF NOT EXISTS "public"."user_questionnaire_responses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "public"."users" ("id"),
    "questionnaire_id" UUID NOT NULL REFERENCES "public"."questionnaires" ("id"),
    "responses" JSONB DEFAULT '{}'::jsonb NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "started_at" TIMESTAMP WITH TIME ZONE,
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indices for user_questionnaire_responses table
CREATE UNIQUE INDEX IF NOT EXISTS "user_questionnaire_responses_user_questionnaire_idx" 
    ON "public"."user_questionnaire_responses" ("user_id", "questionnaire_id");
CREATE INDEX IF NOT EXISTS "user_questionnaire_responses_user_status_idx" 
    ON "public"."user_questionnaire_responses" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "user_questionnaire_responses_questionnaire_id_idx" 
    ON "public"."user_questionnaire_responses" ("questionnaire_id");

-- Comment on table
COMMENT ON TABLE "public"."user_questionnaire_responses" IS 'Stores user progress and answers for questionnaires';

-- Add RLS policies
ALTER TABLE "public"."questionnaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_questionnaire_responses" ENABLE ROW LEVEL SECURITY;

-- Questionnaires policies
CREATE POLICY "Questionnaires are viewable by all authenticated users" 
    ON "public"."questionnaires" FOR SELECT 
    USING (auth.role() = 'authenticated');

-- User responses policies
CREATE POLICY "Users can view only their own responses" 
    ON "public"."user_questionnaire_responses" FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" 
    ON "public"."user_questionnaire_responses" FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own responses" 
    ON "public"."user_questionnaire_responses" FOR UPDATE
    USING (auth.uid() = user_id);

-- Create functions for updated_at timestamp management
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at management
CREATE TRIGGER handle_updated_at_questionnaires
  BEFORE UPDATE ON public.questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_questionnaire_responses
  BEFORE UPDATE ON public.user_questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 