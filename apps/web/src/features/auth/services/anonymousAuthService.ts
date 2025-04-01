import { supabase } from '@/lib/supabase.js';
import { User } from '@supabase/supabase-js';

// Implement anonymous auth using Supabase's native API
export class AnonymousAuthService {
  /**
   * Check if a user is anonymous using Supabase's native is_anonymous flag
   */
  isAnonymousUser(user: User | null): boolean {
    return !!user?.app_metadata?.is_anonymous;
  }

  /**
   * Get or create an anonymous user session using Supabase's native signInAnonymously method
   */
  async getOrCreateAnonymousUser(): Promise<User | null> {
    try {
      // First check if we already have an authenticated session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && session?.user) {
        console.log('Existing session found');
        // If user exists and is anonymous, return it
        if (this.isAnonymousUser(session.user)) {
          console.log('User is already anonymous');
          return session.user;
        }
        
        // If user exists but isn't anonymous, we don't want to replace their session
        console.log('User is signed in but not anonymous');
        return null;
      }
      
      // First we'll check if anonymous auth is properly configured by calling an admin endpoint
      // try {
      //   const { data: configData, error: configError } = await supabase.functions.invoke('check-anonymous-auth', {
      //     method: 'GET'
      //   });
      //   
      //   if (configError) {
      //     console.warn('Anonymous auth check failed, attempting direct sign in:', configError);
      //   } else {
      //     console.log('Anonymous auth configuration status:', configData);
      //   }
      // } catch (e) {
      //   console.warn('Could not verify anonymous auth configuration:', e);
      // }
      
      console.log('No existing session, creating anonymous user');
      // No existing session, create anonymous user
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Error signing in anonymously:', error);
        
        // If we get a database error, it might be a configuration issue
        if (error.message.includes('Database error')) {
          console.error('Supabase database error - please verify anonymous auth is fully configured.');
          console.info('Check if you need to run migrations or have proper database tables for anonymous users.');
        }
        
        throw error;
      }
      
      console.log('Anonymous user created successfully:', data.user?.id);
      return data.user;
    } catch (error) {
      console.error('Error in getOrCreateAnonymousUser:', error);
      
      // Return null but don't fail completely - this allows the app to function even if anonymous auth fails
      return null;
    }
  }

  /**
   * Convert an anonymous user to a permanent user with email link
   */
  async convertToEmailUser(email: string): Promise<{ user: User | null, error: Error | null }> {
    try {
      // First check if this is actually an anonymous user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser || !this.isAnonymousUser(currentUser)) {
        return { 
          user: null, 
          error: new Error('No anonymous user to convert')
        };
      }
      
      // Update the user with email
      const { data, error } = await supabase.auth.updateUser({ email });
      
      if (error) {
        return { user: null, error };
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error converting to email user:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
  
  /**
   * Set password after email verification
   */
  async setPasswordAfterVerification(password: string): Promise<{ user: User | null, error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        return { user: null, error };
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error setting password:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}

// Export a singleton instance
export const anonymousAuthService = new AnonymousAuthService(); 