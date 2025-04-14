import { UserRepository } from '../repositories/userRepository.js';
import type { Tables } from '@innerflame/types';
import { supabase } from '@/lib/supabase.js';

/**
 * Service for handling user-related operations
 */
export class UserService {
  private repository: UserRepository;
  
  constructor() {
    this.repository = new UserRepository();
  }
  
  /**
   * Update a user's profile in both database and auth metadata
   * 
   * @param userId - The user's ID
   * @param userData - The data to update
   */
  async updateProfile(userId: string, userData: {
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<{ data: Tables<'users'> | null, error: string | null }> {
    try {
      // 1. Update the database record first
      const dbResult = await this.repository.updateProfile(userId, {
        full_name: userData.fullName,
        avatar_url: userData.avatarUrl,
        bio: userData.bio
      });
      
      if (dbResult.error) {
        return dbResult;
      }
      
      // 2. Update the auth user metadata to keep JWT data in sync
      // Note: We explicitly update both 'name' and 'full_name' to ensure
      // all UI components display the updated name regardless of which field they use
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          name: userData.fullName, // Add 'name' field for components that use it
          full_name: userData.fullName,
          bio: userData.bio,
          // Only update avatar if provided to avoid overwriting existing one
          ...(userData.avatarUrl ? { avatar_url: userData.avatarUrl } : {})
        }
      });
      
      if (authUpdateError) {
        console.error('Error updating auth user metadata:', authUpdateError);
        // Don't fail the operation if only auth update fails
      }
      
      // 3. Refresh the session to get an updated JWT with the new metadata
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing auth session:', refreshError);
        // Don't fail the operation if only refresh fails
      }
      
      return dbResult;
    } catch (error) {
      console.error('Error in user service updateProfile:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error updating profile'
      };
    }
  }
  
  /**
   * Get a user's profile
   * 
   * @param userId - The user's ID
   */
  async getProfile(userId: string): Promise<{ data: Tables<'users'> | null, error: string | null }> {
    try {
      return await this.repository.getProfile(userId);
    } catch (error) {
      console.error('Error in user service getProfile:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error fetching profile'
      };
    }
  }
  
  /**
   * Refresh the current user's JWT token to get the latest metadata
   */
  async refreshUserSession(): Promise<{ success: boolean, error: string | null }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return { success: false, error: error.message };
      }
      
      // Sync database profile with auth metadata after refresh
      if (data?.session?.user) {
        await this.syncProfileWithAuth(data.session.user.id);
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Exception refreshing session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error refreshing session'
      };
    }
  }
  
  /**
   * Sync the database profile with auth metadata
   * 
   * @param userId - The user's ID
   */
  async syncProfileWithAuth(userId: string): Promise<{ success: boolean, error: string | null }> {
    try {
      return await this.repository.syncProfileWithAuth(userId);
    } catch (error) {
      console.error('Error in user service syncProfileWithAuth:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error syncing profile'
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService(); 