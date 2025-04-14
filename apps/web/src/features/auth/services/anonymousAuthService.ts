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
        // If user exists and is anonymous, return it
        if (this.isAnonymousUser(session.user)) {
          return session.user;
        }
        
        // If user exists but isn't anonymous, we don't want to replace their session
        return null;
      }
      
      // Check if we have any auth tokens in localStorage before attempting to sign in
      // This helps prevent race conditions where sign-out is happening simultaneously
      const hasLocalStorageTokens = this.hasAuthTokensInLocalStorage();
      if (hasLocalStorageTokens) {
        // Wait a moment to let potential sign-out operations complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Re-check session after brief delay
        const { data: { session: recheckedSession } } = await supabase.auth.getSession();
        if (recheckedSession?.user) {
          if (this.isAnonymousUser(recheckedSession.user)) {
            return recheckedSession.user;
          }
          return null;
        }
      }
      
      // No existing session, create anonymous user
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        throw error;
      }
      
      return data.user;
    } catch (error) {
      // Return null but don't fail completely - this allows the app to function even if anonymous auth fails
      return null;
    }
  }

  /**
   * Helper function to check if auth tokens exist in localStorage
   */
  private hasAuthTokensInLocalStorage(): boolean {
    return !!(
      localStorage.getItem('supabase.auth.token') || 
      localStorage.getItem('sb-lpxnyybizytwcqdqasll-auth-token')
    );
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
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Convert anonymous user to registered user by linking with Google
   * This is a higher-level method that wraps the linkIdentity functionality
   * with better error handling and verification
   */
  async convertAnonymousToRegisteredUser(provider: 'google'): Promise<{ success: boolean, error: Error | null }> {
    try {
      // Verify current user is anonymous
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        return { 
          success: false, 
          error: new Error(`Failed to get current user: ${userError.message}`) 
        };
      }
      
      if (!currentUser) {
        return { 
          success: false, 
          error: new Error('No user is currently signed in')
        };
      }
      
      if (!this.isAnonymousUser(currentUser)) {
        return {
          success: false,
          error: new Error('Current user is already a registered user')
        };
      }
      
      // Proceed with linking
      if (provider === 'google') {
        const { error } = await supabase.auth.linkIdentity({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });
        
        if (error) {
          return {
            success: false,
            error: new Error(`Failed to link with ${provider}: ${error.message}`)
          };
        }
        
        return { success: true, error: null };
      }
      
      return {
        success: false,
        error: new Error(`Unsupported provider: ${provider}`)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error during conversion')
      };
    }
  }
}

// Export a singleton instance
export const anonymousAuthService = new AnonymousAuthService(); 