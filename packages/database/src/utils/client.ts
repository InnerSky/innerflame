// Supabase client initialization and configuration

import { createClient } from '@supabase/supabase-js';

// These would typically come from environment variables
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_ANON_KEY;

// Initialize the Supabase client
export const createSupabaseClient = (customUrl?: string, customKey?: string) => {
  const url = customUrl || supabaseUrl;
  const key = customKey || supabaseKey;
  
  if (!url || !key) {
    throw new Error('Supabase URL and anon key are required');
  }
  
  return createClient(url, key);
};

// Default client instance
export const supabase = createSupabaseClient();

// Types for database tables will be exported from generated types
// export type { Database } from '../types/supabase';
