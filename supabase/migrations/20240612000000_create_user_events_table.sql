-- Create user_events table for tracking user actions
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  session_id TEXT,
  event_category TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_label TEXT,
  event_value NUMERIC,
  event_data JSONB,
  client_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  
  -- Add index for faster queries by user
  CONSTRAINT fk_user_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add index for faster queries by user and time range
CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_created_at ON public.user_events(created_at);
CREATE INDEX idx_user_events_category_action ON public.user_events(event_category, event_action);

-- RLS Policies
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Admin can read all events
CREATE POLICY "Admins can read all events" 
  ON public.user_events 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Users can create events for themselves
CREATE POLICY "Users can create their own events" 
  ON public.user_events 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can read their own events
CREATE POLICY "Users can read their own events" 
  ON public.user_events 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create a function to check rate limits for event creation
CREATE OR REPLACE FUNCTION check_event_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  event_count INTEGER;
  threshold_reached BOOLEAN;
BEGIN
  -- Count events from this user in the last minute
  SELECT COUNT(*) INTO event_count
  FROM public.user_events
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '1 minute';
  
  -- If under threshold, allow normally
  IF event_count < 20 THEN
    threshold_reached := FALSE;
    RETURN NEW;
  END IF;
  
  -- If we're at exactly 20, this is the threshold event
  IF event_count = 20 THEN
    -- Modify this event to indicate it's a threshold event
    NEW.event_category := 'system';
    NEW.event_action := 'rate_limit_reached';
    NEW.event_data := jsonb_build_object(
      'original_category', NEW.event_category,
      'original_action', NEW.event_action,
      'count', event_count
    );
    threshold_reached := TRUE;
    RETURN NEW;
  END IF;
  
  -- Over threshold, don't save
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting events
CREATE TRIGGER check_event_rate_before_insert
BEFORE INSERT ON public.user_events
FOR EACH ROW
EXECUTE FUNCTION check_event_rate_limit(); 