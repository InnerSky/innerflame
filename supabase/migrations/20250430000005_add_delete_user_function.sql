-- Create a function to handle the deletion of all user data in the correct order
CREATE OR REPLACE FUNCTION public.delete_user_data(user_id UUID)
RETURNS void AS $$
DECLARE
  entity_ids UUID[];
BEGIN
  -- Step 1: Get all entity IDs belonging to the user
  SELECT array_agg(id) INTO entity_ids FROM entities WHERE user_id = $1;
  
  -- Step 2: Delete user's message tags
  DELETE FROM message_tags
  WHERE message_id IN (SELECT id FROM messages WHERE user_id = $1);
  
  -- Step 3: Delete user's message references
  DELETE FROM message_references
  WHERE message_id IN (SELECT id FROM messages WHERE user_id = $1);
  
  -- Step 4: Delete all messages from the user
  DELETE FROM messages WHERE user_id = $1;
  
  -- Step 5: Delete all questionnaire responses from the user
  DELETE FROM questionnaire_responses WHERE user_id = $1;
  
  -- Step 6: Delete all user events
  DELETE FROM user_events WHERE user_id = $1;
  
  -- Only proceed with entity deletion if user has entities
  IF entity_ids IS NOT NULL AND array_length(entity_ids, 1) > 0 THEN
    -- Step 7: Update all entities to remove active version references
    UPDATE entities
    SET active_version_id = NULL
    WHERE id = ANY(entity_ids);
    
    -- Step 8: Delete entity versions
    DELETE FROM entity_versions
    WHERE entity_id = ANY(entity_ids);
    
    -- Step 9: Delete entities
    DELETE FROM entities
    WHERE id = ANY(entity_ids);
  END IF;
  
  -- Step 10: Finally delete the user record
  DELETE FROM users WHERE id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 