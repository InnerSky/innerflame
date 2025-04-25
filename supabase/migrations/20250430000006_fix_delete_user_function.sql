-- Fix ambiguous column references in the delete_user_data function
CREATE OR REPLACE FUNCTION public.delete_user_data(user_id UUID)
RETURNS void AS $$
DECLARE
  entity_ids UUID[];
BEGIN
  -- Step 1: Get all entity IDs belonging to the user
  SELECT array_agg(e.id) INTO entity_ids FROM entities e WHERE e.user_id = user_id;
  
  -- Step 2: Delete user's message tags
  DELETE FROM message_tags mt
  WHERE mt.message_id IN (SELECT m.id FROM messages m WHERE m.user_id = user_id);
  
  -- Step 3: Delete user's message references
  DELETE FROM message_references mr
  WHERE mr.message_id IN (SELECT m.id FROM messages m WHERE m.user_id = user_id);
  
  -- Step 4: Delete all messages from the user
  DELETE FROM messages m WHERE m.user_id = user_id;
  
  -- Step 5: Delete all questionnaire responses from the user
  DELETE FROM questionnaire_responses qr WHERE qr.user_id = user_id;
  
  -- Step 6: Delete all user events
  DELETE FROM user_events ue WHERE ue.user_id = user_id;
  
  -- Only proceed with entity deletion if user has entities
  IF entity_ids IS NOT NULL AND array_length(entity_ids, 1) > 0 THEN
    -- Step 7: Update all entities to remove active version references
    UPDATE entities e
    SET active_version_id = NULL
    WHERE e.id = ANY(entity_ids);
    
    -- Step 8: Delete entity versions
    DELETE FROM entity_versions ev
    WHERE ev.entity_id = ANY(entity_ids);
    
    -- Step 9: Delete entities
    DELETE FROM entities e
    WHERE e.id = ANY(entity_ids);
  END IF;
  
  -- Step 10: Finally delete the user record
  DELETE FROM users u WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 