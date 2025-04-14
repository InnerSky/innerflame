import { supabase } from '@/lib/supabase.js';
import type { Tables } from '@innerflame/types';

/**
 * Repository for handling user data operations
 */
export class UserRepository {
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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

  /**
   * Sync the user's profile in the database with the latest auth metadata
   * This ensures the database is in sync with the JWT
   * 
   * @param userId - The user's ID
   */
  async syncProfileWithAuth(userId: string): Promise<{ success: boolean, error: string | null }> {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }
    
    try {
      // Get the latest user from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        return { 
          success: false, 
          error: authError?.message || 'Failed to get auth user'
        };
      }
      
      // Only proceed if IDs match
      if (authUser.id !== userId) {
        return { 
          success: false,
          error: 'User ID mismatch between auth and requested ID'
        };
      }
      
      // Get the display name from user_metadata, checking both name and full_name fields
      const displayName = authUser.user_metadata?.full_name || 
                          authUser.user_metadata?.name;
      
      // Update database with auth metadata
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: authUser.email,
          full_name: displayName,
          avatar_url: authUser.user_metadata?.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error syncing profile with auth metadata:', updateError);
        return { success: false, error: updateError.message };
      }
      
      // Also make sure auth metadata has both name and full_name fields
      if (displayName && 
          (authUser.user_metadata?.name !== displayName || 
           authUser.user_metadata?.full_name !== displayName)) {
        
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: {
            name: displayName,
            full_name: displayName
          }
        });
        
        if (authUpdateError) {
          console.error('Error normalizing auth metadata fields:', authUpdateError);
          // Don't fail the operation if only this step fails
        }
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Exception syncing profile with auth:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error syncing profile'
      };
    }
  }
} 