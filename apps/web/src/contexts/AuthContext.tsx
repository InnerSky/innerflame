import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, signOut, linkGoogleIdentity, AuthError } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { anonymousAuthService } from '@/features/auth/services/anonymousAuthService.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  isAnonymous: boolean;
  signInWithGoogle: (isAnonymous?: boolean) => Promise<{ error: AuthError | null }>;
  linkGoogleAccount: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user, error } = await getCurrentUser();
        
        if (error) {
          setError(error);
          setUser(null);
          setIsAnonymous(false);
        } else {
          setUser(user);
          // Check if user is anonymous using Supabase's native is_anonymous flag
          setIsAnonymous(!!user?.app_metadata?.is_anonymous);
          console.log('Auth context user loaded:', { 
            id: user?.id,
            isAnonymous: !!user?.app_metadata?.is_anonymous
          });
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError(err instanceof Error ? { message: err.message } : { message: 'Unknown error' });
      } finally {
        setLoading(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Check if user is anonymous using Supabase's native is_anonymous flag
      const userIsAnonymous = !!session?.user?.app_metadata?.is_anonymous;
      setIsAnonymous(userIsAnonymous);
      console.log('Auth state changed:', { 
        event: _event, 
        userId: session?.user?.id,
        isAnonymous: userIsAnonymous
      });
      setLoading(false);
    });

    loadUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (isAnonymous: boolean = false): Promise<{ error: AuthError | null }> => {
    // If user is anonymous, we should link the identity instead of signing in
    // This will be reimplemented using Supabase's native linkIdentity API
    try {
      if (isAnonymous) {
        console.log('Linking anonymous user to Google account');
        return linkGoogleAccount();
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { error: error as AuthError };
    }
  };

  const linkGoogleAccount = async (): Promise<{ error: AuthError | null }> => {
    try {
      console.log('Linking anonymous user to Google account with native Supabase API');
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Error linking Google account:', error);
        return { error };
      }
      
      console.log('Successfully started Google account linking flow');
      return { error: null };
    } catch (error) {
      console.error('Exception during Google account linking:', error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    loading,
    error,
    isAnonymous,
    signInWithGoogle,
    linkGoogleAccount,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}