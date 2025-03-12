# Orphaned Entity Versions Cleanup Utility

This utility helps resolve database issues related to orphaned entity versions.

## Problem

When an entity is deleted but its versions remain in the `entity_versions` table, it creates orphaned records. These orphaned records can cause issues with foreign key constraints and database integrity.

## Solution

This utility script:
1. Identifies entity_versions records where the corresponding entity no longer exists
2. Removes foreign key constraints by setting base_version_id to null where needed
3. Deletes the orphaned entity_version records

## How to Run

To run the cleanup utility:

```bash
# Navigate to the project root directory
cd /path/to/project

# Make sure dependencies are installed
npm install dotenv @supabase/supabase-js --save-dev

# Run the utility directly with tsx
npx tsx src/UtilityScript/OrphanedEntityVersions/cleanupOrphanedEntityVersions.ts

# Or alternatively, navigate to the utility directory and run the helper script
cd src/UtilityScript/OrphanedEntityVersions
node run-cleanup.js
```

### Requirements

- Node.js environment
- `.env` file with Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)

## Technical Details

The script performs the following steps:
1. Fetches all records from entity_versions
2. Fetches all entity IDs from the entities table
3. Identifies which entity_versions have an entity_id that doesn't exist in entities
4. Updates any foreign key references to null
5. Deletes the orphaned records in batches

The script handles errors gracefully and provides console output for monitoring progress. 