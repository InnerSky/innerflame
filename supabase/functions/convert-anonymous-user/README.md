# Convert Anonymous User Edge Function

This edge function removes the `is_anonymous` flag from a user's `app_metadata` when they convert from an anonymous user to a permanent user by linking a Google account.

## Deployment

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase CLI:
   ```bash
   supabase login
   ```

3. Deploy the function:
   ```bash
   supabase functions deploy convert-anonymous-user --project-ref YOUR_PROJECT_REF
   ```

   Replace `YOUR_PROJECT_REF` with your Supabase project reference ID found in the URL of your Supabase dashboard.

## Environment Variables

This function requires the following environment variables to be set:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role API key (this has admin privileges)

You can set these variables in the Supabase dashboard under Settings > API > Functions.

## TypeScript Configuration

Supabase Edge Functions run in a Deno environment, which can cause TypeScript errors in a Node.js-based project. To fix this:

1. Add `// @ts-nocheck` at the top of your Edge Function file:
   ```typescript
   // @ts-nocheck - Supabase Edge Functions use Deno runtime
   import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
   ```

2. This approach:
   - Prevents TypeScript errors from Deno imports and globals
   - Keeps the solution simple without additional configuration files
   - Doesn't affect runtime functionality in production
   - Works because Edge Functions run in Supabase's Deno environment, not your local TypeScript environment

3. Alternative options (more complex):
   - Create a separate `tsconfig.json` for Edge Functions
   - Add triple-slash reference directives
   - Set up a Deno configuration file

For most projects, the `@ts-nocheck` approach is sufficient and keeps maintenance simple.

## Usage

The function is called from the client-side `updateUserProfile` function in `apps/web/src/lib/auth.ts` when an anonymous user links their Google account.

## Security

This function uses the service role key which has admin privileges. It should only be used for operations that cannot be performed client-side, such as modifying `app_metadata`.

The function verifies the user exists before modifying their metadata to ensure proper authorization. 