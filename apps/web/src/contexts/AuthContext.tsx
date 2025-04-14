import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, signOut as signOutUtil, linkGoogleIdentity, AuthError, signInWithGoogle as signInWithGoogleUtil } from '@/lib/auth';
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

  // --- Direct Function to Query Database for Anonymous Status ---
  async function getAnonymousStatusFromDatabase(userId: string): Promise<boolean | null> {
    if (!userId) return null;
    
    // Add a timeout to prevent this function from hanging
    const timeoutPromise = new Promise<boolean | null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database query timeout'));
      }, 5000); // 5 second timeout
    });
    
    try {
      // Race the database query against the timeout
      return await Promise.race([
        (async () => {
          // First try to get the user from the auth.users table via admin API
          try {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            
            if (!authUser || authError) {
              throw new Error(authError?.message || 'Failed to get auth user');
            }
            
            if (authUser.id === userId) {
              // If we got the user and the ID matches, use the app_metadata
              return !!authUser.app_metadata?.is_anonymous;
            }
            
            throw new Error('User ID mismatch');
          } catch (e) {
            throw e; // No need for fallback now that we rely on JWT
          }
        })(),
        timeoutPromise
      ]);
    } catch (err) {
      return null;
    }
  }
  
  // --- Effect to check database on page visibility change ---
  useEffect(() => {
    // This will run when the page becomes visible again (tab switch, refresh, etc.)
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && user?.id) {
        // Refresh JWT when page becomes visible to ensure latest data
        supabase.auth.refreshSession().catch(err => {
          console.error('Error refreshing session on visibility change:', err);
        });
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);
  
  // --- Effect for Initial Load (improved) ---
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError(null);
      try {
        // Refresh the session first to get the latest metadata
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Error refreshing initial session:', refreshError);
          // Continue anyway to get current session
        }
        
        // Directly use getCurrentUser (which calls getSession)
        const { user: initialAuthUser, error: authError } = await getCurrentUser();
        
        if (authError) {
          setError(authError);
          setUser(null);
          setIsAnonymous(false);
        } else if (initialAuthUser) {
          // Session loaded successfully
          setUser(initialAuthUser);
          
          // Trust JWT metadata directly - no need for database verification
          const isAnon = !!initialAuthUser.app_metadata?.is_anonymous;
          setIsAnonymous(isAnon);
        } else {
          // No session found
          setUser(null);
          setIsAnonymous(false);
          // NOTE: Automatic anonymous sign-in is handled by App.tsx
        }
      } catch (err) {
        setError(err instanceof Error ? { message: err.message } : { message: 'Unknown error' });
        setUser(null);
        setIsAnonymous(false);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Effect for Auth State Changes ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true); 
      const sessionUser = session?.user;

      try {
          switch (_event) {
            case 'SIGNED_IN':
              // Trust the session user data provided directly by Supabase
              if (sessionUser) {
                // Get anonymous status directly from JWT metadata
                const isAnon = !!sessionUser.app_metadata?.is_anonymous;
                
                // Update state with the session user
                setUser(sessionUser);
                setIsAnonymous(isAnon);
              } else {
                setUser(null);
                setIsAnonymous(false);
              }
              break;

            case 'SIGNED_OUT':
              setUser(null);
              setIsAnonymous(false);
              // Ensure storage is cleared
              localStorage.removeItem('supabase.auth.token'); 
              localStorage.removeItem(`sb-lpxnyybizytwcqdqasll-auth-token`);
              break;

            case 'TOKEN_REFRESHED':
              try {
                if (sessionUser) {
                  // For TOKEN_REFRESHED, we can trust the JWT metadata directly
                  // since the token has just been refreshed from the database
                  const isAnon = !!sessionUser.app_metadata?.is_anonymous;
                  
                  // Update state with JWT data
                  setUser(sessionUser);
                  setIsAnonymous(isAnon);
                } else {
                  setUser(null);
                  setIsAnonymous(false);
                }
              } catch (err) {
                // Don't force sign out for transient errors during token refresh
                if (sessionUser) {
                  setUser(sessionUser);
                  setIsAnonymous(!!sessionUser.app_metadata?.is_anonymous);
                }
              }
              break;

            case 'USER_UPDATED':
              if (sessionUser) {
                // Get previous anonymous state
                const wasAnonymous = isAnonymous;
                const isNowAnonymous = !!sessionUser.app_metadata?.is_anonymous;
                
                // Update state
                setUser(sessionUser);
                setIsAnonymous(isNowAnonymous);
              } else {
                // Warning: Event occurred but sessionUser is null
              }
              break;
              
            default:
              // Unhandled event type
          }
      } catch (err) {
          // Attempt defensive sign out
           try { await signOutUtil(); } catch (e) { /* Emergency sign out failed */ }
           setUser(null);
           setIsAnonymous(false);
      } finally {
          // CRITICAL: Always set loading to false when done processing,
          // regardless of success or failure
          setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run this effect only once on mount
  
  // --- Exposed SignOut Function ---
  const signOut = async (): Promise<{ error: AuthError | null }> => {
      setLoading(true);
      const result = await signOutUtil(); 
      // State updates happen via the SIGNED_OUT event listener
      setLoading(false);
      return result;
  };

  // --- Exposed Actions (Refined signInWithGoogle) ---
  const signInWithGoogle = async (isAnonymousFlow: boolean = false): Promise<{ error: AuthError | null }> => {
    if (isAnonymousFlow) {
      // Linking anonymous user
      return linkGoogleIdentity(); 
    } else {
      // Standard Google Sign-In/Sign-Up
      // Ensure we are fully signed out first to avoid conflicts
      await signOut(); // Ensure clean slate
      return await signInWithGoogleUtil(false); // Call the one from lib/auth
    }
  };

  // linkGoogleAccount remains a direct call to the lib function
  const linkGoogleAccount = async (): Promise<{ error: AuthError | null }> => {
     return linkGoogleIdentity();
  };

  // --- Context Value ---
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