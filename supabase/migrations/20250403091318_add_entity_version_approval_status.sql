-- Add approval_status column to entity_versions table
ALTER TABLE public.entity_versions ADD COLUMN approval_status TEXT DEFAULT 'accepted';

-- Add a comment to the column
COMMENT ON COLUMN public.entity_versions.approval_status IS 'Tracks whether an AI edit has been approved by the user. Values: pending_approval, accepted, rejected';

-- Update existing ai_edit versions to be marked as accepted
UPDATE public.entity_versions SET approval_status = 'accepted' WHERE version_type = 'ai_edit'; 