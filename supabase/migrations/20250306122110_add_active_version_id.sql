-- Migration: Add active_version_id to entities table
-- Description: Adds a column to track the current version of each entity

-- Add the active_version_id column
ALTER TABLE entities 
ADD COLUMN active_version_id UUID REFERENCES entity_versions(id);

-- Create an index for faster lookups
CREATE INDEX entities_active_version_id_idx ON entities(active_version_id);

-- Add a trigger to automatically update active_version_id when a version becomes current
CREATE OR REPLACE FUNCTION update_entity_active_version() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = true THEN
        UPDATE entities 
        SET active_version_id = NEW.id 
        WHERE id = NEW.entity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_entity_active_version
    AFTER UPDATE OF is_current ON entity_versions
    FOR EACH ROW
    WHEN (NEW.is_current = true)
    EXECUTE FUNCTION update_entity_active_version();

-- Backfill existing entities with their current versions
UPDATE entities e
SET active_version_id = (
    SELECT id 
    FROM entity_versions ev
    WHERE ev.entity_id = e.id 
    AND ev.is_current = true
    LIMIT 1
); 