/**
 * Shared Supabase Service
 * 
 * Provides access to the Supabase client for API services
 */
import { createSupabaseClient } from '@innerflame/utils/supabase.js';

// Singleton instance of the Supabase client
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export class SupabaseService {
  /**
   * Get the Supabase client instance
   * Creates it if it doesn't exist
   */
  static getClient() {
    if (!supabaseClient) {
      supabaseClient = createSupabaseClient();
    }
    
    return supabaseClient;
  }
  
  /**
   * Set the Supabase client instance
   * Useful for testing or when the client is created elsewhere
   */
  static setClient(client: ReturnType<typeof createSupabaseClient>) {
    supabaseClient = client;
  }
} 