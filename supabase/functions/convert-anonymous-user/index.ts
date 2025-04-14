// @ts-nocheck - Supabase Edge Functions use Deno runtime
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Verify the required environment variables exist
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Required environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not set');
}

console.log('Edge function for converting anonymous users initialized');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }

  try {
    // Parse the request body to get the user ID
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log(`Converting user ${userId} from anonymous to permanent`);

    // Create a Supabase client with the service role key (admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // First, get the current user data to ensure they exist
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      console.error('Error getting user:', getUserError);
      return new Response(
        JSON.stringify({ error: getUserError?.message || 'User not found' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Update the user's app_metadata to remove the is_anonymous flag
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        app_metadata: {
          // Preserve other metadata but remove is_anonymous
          ...user.app_metadata,
          is_anonymous: null
        } 
      }
    );

    if (error) {
      console.error('Error updating user metadata:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log(`Successfully converted user ${userId} to permanent user`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User successfully converted to permanent user',
        user: data.user 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
}); 