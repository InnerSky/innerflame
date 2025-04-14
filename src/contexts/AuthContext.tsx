import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Session, User as AuthUser, createClient } from '@supabase/supabase-js';

// Type augmentation for Vite's import.meta
interface ImportMeta {
  env: {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    [key: string]: string;
  };
}

// Types
type User = AuthUser | null;

type AuthState = {
  user: User;
  session: Session | null;
  isLoading: boolean;
  isAnonymous: boolean;
  error: Error | null;
};

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'SET_SESSION'; session: Session | null; user: User }
  | { type: 'AUTH_ERROR'; error: Error }
  | { type: 'SIGNED_OUT' };

interface AuthContextType extends AuthState {
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAnonymous: false,
  error: null,
};

// Create Supabase client
// @ts-ignore - Vite environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
// @ts-ignore - Vite environment variables
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Reducer for managing auth state
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_SESSION':
      return {
        ...state,
        user: action.user,
        session: action.session,
        isAnonymous: !!action.user?.app_metadata?.is_anonymous,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'SIGNED_OUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user exists in the database
  const validateUserExists = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      return !error && !!data;
    } catch (error) {
      return false;
    }
  }, []);

  // Sign in anonymously
  const signInAnonymously = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;
      
      dispatch({ 
        type: 'SET_SESSION', 
        session: data.session, 
        user: data.user 
      });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
    }
  }, []);

  // Link Google account to current user
  const linkGoogleAccount = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'SIGNED_OUT' });
      // Automatically create anonymous user after sign out
      await signInAnonymously();
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
    }
  }, [signInAnonymously]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session?.user) {
        const userExists = await validateUserExists(session.user.id);
        
        if (!userExists) {
          await supabase.auth.signOut();
          dispatch({ type: 'SIGNED_OUT' });
          await signInAnonymously();
          return;
        }
        
        dispatch({ 
          type: 'SET_SESSION', 
          session, 
          user: session.user 
        });
      } else {
        await signInAnonymously();
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
    }
  }, [validateUserExists, signInAnonymously]);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Validate session if it exists
      if (session?.user?.id) {
        const userExists = await validateUserExists(session.user.id);
        
        if (!userExists) {
          // User doesn't exist in the database, sign out
          await supabase.auth.signOut();
          dispatch({ type: 'SIGNED_OUT' });
          // Create anonymous user
          await signInAnonymously();
          return;
        }
        
        dispatch({ 
          type: 'SET_SESSION', 
          session, 
          user: session.user 
        });
      } else {
        // No session, create anonymous user
        await signInAnonymously();
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', error: error as Error });
      // Attempt anonymous sign-in as fallback
      await signInAnonymously();
    }
  }, [validateUserExists, signInAnonymously]);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const userExists = await validateUserExists(session.user.id);
            
            if (!userExists) {
              await supabase.auth.signOut();
              dispatch({ type: 'SIGNED_OUT' });
              await signInAnonymously();
              return;
            }
            
            dispatch({ 
              type: 'SET_SESSION', 
              session, 
              user: session.user 
            });
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SIGNED_OUT' });
          // Create anonymous user after sign out
          await signInAnonymously();
        }
      }
    );

    // Initialize auth on mount
    initializeAuth();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, validateUserExists, signInAnonymously]);

  // Memoized context value
  const value = React.useMemo(() => ({
    ...state,
    signInAnonymously,
    signInWithGoogle,
    linkGoogleAccount,
    signOut,
    refreshSession,
  }), [
    state,
    signInAnonymously,
    signInWithGoogle,
    linkGoogleAccount,
    signOut,
    refreshSession
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 