-- Create history table
CREATE TABLE IF NOT EXISTS public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add inHistory_id to messages table
ALTER TABLE public.messages 
ADD COLUMN inHistory_id UUID REFERENCES public.history(id) ON DELETE SET NULL;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS history_user_id_idx ON public.history(user_id);
CREATE INDEX IF NOT EXISTS messages_inHistory_id_idx ON public.messages(inHistory_id);

-- Enable RLS
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to select only their own history records
CREATE POLICY "Users can view their own history"
  ON public.history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own history records
CREATE POLICY "Users can create their own history"
  ON public.history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update only their own history records
CREATE POLICY "Users can update their own history"
  ON public.history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete only their own history records
CREATE POLICY "Users can delete their own history"
  ON public.history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for admins to access all history records
CREATE POLICY "Admins can do anything with history"
  ON public.history
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.is_admin = true
  ));

-- Trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_history_updated_at
BEFORE UPDATE ON public.history
FOR EACH ROW
EXECUTE FUNCTION update_history_updated_at(); 