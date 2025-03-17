/**
 * Supabase utilities
 */
import { createClient } from '@supabase/supabase-js';
import type { User } from '@innerflame/types/user.js';

/**
 * Create and configure a Supabase client
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_KEY || '';
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get the current authenticated user
 */
export async function getUser() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data.user as unknown as User;
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data.session;
} 