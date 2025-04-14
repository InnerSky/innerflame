import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@innerflame/types';

/**
 * Repository for handling user data operations
 */
export class UserRepository {
  private supabase;
  
  constructor(supabaseUrl?: string, supabaseKey?: string) {
    // Allow for dependency injection or use environment variables
    const url = supabaseUrl || process.env.SUPABASE_URL || '';
    const key = supabaseKey || process.env.SUPABASE_SERVICE_KEY || '';
    
    if (!url || !key) {
      throw new Error('Missing Supabase credentials for UserRepository');
    }
    
    this.supabase = createClient<Database>(url, key);
  }
  
  /**
   * Update a user's profile in the database
   * 
   * @param userId - The user's ID
   * @param userData - The user data to update
   */
  async updateProfile(userId: string, userData: {
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  }): Promise<{ data: Tables<'users'> | null, error: string | null }> {
    if (!userId) {
      return { data: null, error: 'No user ID provided' };
    }
    
    try {
      // Prepare the update data with timestamp
      const updateData = {
        ...userData,
        updated_at: new Date().toISOString()
      };
      
      // Update the user in the database
      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('Exception updating user profile:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Unknown error updating profile' 
      };
    }
  }
  
  /**
   * Get a user profile by ID
   * 
   * @param userId - The user's ID
   */
  async getProfile(userId: string): Promise<{ data: Tables<'users'> | null, error: string | null }> {
    if (!userId) {
      return { data: null, error: 'No user ID provided' };
    }
    
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Unknown error fetching profile' 
      };
    }
  }
} 