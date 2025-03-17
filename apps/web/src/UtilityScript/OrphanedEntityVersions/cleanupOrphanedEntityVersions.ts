/**
 * Utility Script: Cleanup Orphaned Entity Versions
 * 
 * This script identifies and removes entity_versions records where the corresponding
 * entity (in the entities table) has been deleted, but the versions remain.
 * 
 * It follows these steps:
 * 1. Find all entity_versions where the entity_id doesn't exist in the entities table
 * 2. Update their base_version_id to null to clear foreign key constraints
 * 3. Delete these orphaned entity_version records
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(rootDir, '.env') });

// Create a direct Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface EntityVersion {
  id: string;
  entity_id: string;
  base_version_id: string | null;
}

interface Entity {
  id: string;
}

async function cleanupOrphanedEntityVersions() {
  console.log('Starting cleanup of orphaned entity versions...');
  
  try {
    // Step 1: Get all entity_ids from entity_versions
    const { data: allVersions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('id, entity_id, base_version_id');
    
    if (versionsError) {
      throw new Error(`Error fetching versions: ${versionsError.message}`);
    }
    
    if (!allVersions || allVersions.length === 0) {
      console.log('No entity versions found. Exiting.');
      return;
    }
    
    // Step 2: Get all entity_ids from entities
    const { data: allEntities, error: entitiesError } = await supabase
      .from('entities')
      .select('id');
    
    if (entitiesError) {
      throw new Error(`Error fetching entities: ${entitiesError.message}`);
    }
    
    if (!allEntities) {
      console.log('No entities found. Exiting.');
      return;
    }
    
    // Step 3: Find orphaned versions (those with entity_ids not in entities)
    const entityIds = new Set(allEntities.map((entity: Entity) => entity.id));
    const orphanedVersions = allVersions.filter((version: any) => !entityIds.has(version.entity_id)) as EntityVersion[];
    
    console.log(`Found ${orphanedVersions.length} orphaned entity versions`);
    
    if (orphanedVersions.length === 0) {
      console.log('No orphaned versions to clean up. Exiting.');
      return;
    }
    
    // Step 4: Get all version IDs that will be deleted
    const orphanedIds = orphanedVersions.map((v: EntityVersion) => v.id);
    
    // Step 5: Clear foreign key constraints by setting base_version_id to null
    // for all versions that reference the versions we're about to delete
    console.log('Clearing foreign key constraints...');
    
    // Find versions that reference orphaned versions
    const referencingVersions = allVersions.filter(
      (v: any) => v.base_version_id && orphanedIds.includes(v.base_version_id)
    );
    
    if (referencingVersions.length > 0) {
      const referencingIds = referencingVersions.map((v: any) => v.id);
      
      console.log(`Clearing ${referencingIds.length} foreign key references...`);
      
      const { error: updateError } = await supabase
        .from('entity_versions')
        .update({ base_version_id: null })
        .in('id', referencingIds);
      
      if (updateError) {
        throw new Error(`Error clearing foreign keys: ${updateError.message}`);
      }
    } else {
      console.log('No foreign key references to clear.');
    }
    
    // Step 6: Delete the orphaned versions
    console.log(`Deleting ${orphanedIds.length} orphaned versions...`);
    
    // Delete in batches to avoid request size limitations
    const batchSize = 100;
    for (let i = 0; i < orphanedIds.length; i += batchSize) {
      const batch = orphanedIds.slice(i, i + batchSize);
      console.log(`Deleting batch ${i/batchSize + 1}/${Math.ceil(orphanedIds.length/batchSize)}...`);
      
      const { error: deleteError } = await supabase
        .from('entity_versions')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        throw new Error(`Error deleting orphaned versions (batch ${i/batchSize + 1}): ${deleteError.message}`);
      }
    }
    
    console.log(`Successfully deleted ${orphanedIds.length} orphaned entity versions`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error during cleanup:', error.message);
    } else {
      console.error('Unknown error during cleanup');
    }
  }
}

// Execute the cleanup function
cleanupOrphanedEntityVersions()
  .then(() => console.log('Cleanup process completed'))
  .catch(err => console.error('Cleanup process failed:', err)); 