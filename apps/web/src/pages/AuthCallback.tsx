import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase.js";
import { updateUserProfile } from "@/lib/auth.js";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuthGoogleButtons } from "@/components/auth/AuthGoogleButtons";

export default function AuthCallback() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Apply any pending profile updates from linking identity
    const handlePendingProfileUpdate = async () => {
      const pendingUpdate = localStorage.getItem('pendingProfileUpdate');
      const userId = localStorage.getItem('profileUpdateUserId');
      
      if (pendingUpdate === 'true' && userId) {
        console.log('Found pending profile update after OAuth redirect');
        
        try {
          // Get the latest user data
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error('Failed to get user after OAuth redirect:', userError);
          } else if (user.id === userId) {
            // User ID matches the stored one, update profile
            console.log('Applying pending profile update for user:', user.id);
            
            // Check if this user is already being processed in a token refresh
            if (sessionStorage.getItem('refreshing_anonymous_user') === user.id) {
              console.log('Profile update already in progress during token refresh, skipping duplicate update');
            } else {
              // Extract profile data from user object
              await updateUserProfile(user.id, {
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url
              });
            }
            
            console.log('Profile update applied successfully');
          } else {
            console.warn('User ID mismatch. Expected:', userId, 'Got:', user.id);
          }
        } catch (err) {
          console.error('Error applying pending profile update:', err);
        } finally {
          // Clear the pending update flags regardless of outcome
          localStorage.removeItem('pendingProfileUpdate');
          localStorage.removeItem('profileUpdateUserId');
        }
      }
    };

    // Process the OAuth callback
    const processCallback = async () => {
      try {
        console.log('Starting OAuth callback processing...');
        
        // Check for and handle any OAuth errors
        const queryParams = new URLSearchParams(window.location.search);
        const error = queryParams.get("error");
        const errorDescription = queryParams.get("error_description");
        
        if (error) {
          console.error("OAuth error:", error, errorDescription);
          setError(`${error}: ${errorDescription}`);
          return;
        }
        
        // Get the hash fragment which contains the session
        if (window.location.hash) {
          console.log('Found hash fragment, retrieving session...');
          
          // Get session and handle pending profile updates
          console.log('Getting session...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Error getting session:", sessionError);
            setError(sessionError.message);
            return;
          }
          
          if (session) {
            console.log("Session retrieved successfully, user:", session.user.id);
            
            // Check if token refresh is in progress
            if (sessionStorage.getItem('refreshing_anonymous_user') === session.user.id) {
              console.log('Token refresh in progress for this user, waiting 2 seconds before proceeding...');
              // Add a short delay to allow token refresh to complete
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Apply any pending profile updates from linking
            console.log('Applying pending profile updates...');
            await handlePendingProfileUpdate();
            
            // Redirect to the intended destination
            console.log('Authentication complete, redirecting...');
            
            // Clean up any lingering flags
            const userId = session.user.id;
            if (sessionStorage.getItem('refreshing_anonymous_user') === userId) {
              console.log('Cleaning up refresh flag for user:', userId);
              sessionStorage.removeItem('refreshing_anonymous_user');
            }
            
            setRedirectTo("/");
          } else {
            console.warn("No session found in callback");
            setRedirectTo("/");
          }
        } else {
          console.warn("No hash fragment found in URL");
          setRedirectTo("/");
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    };
    
    processCallback();
  }, []);

  if (error) {
    // Get the error description directly from URL parameters
    const queryParams = new URLSearchParams(window.location.search);
    const errorDescription = queryParams.get("error_description") || "Unknown error occurred";
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white to-orange-50/30 dark:from-neutral-900 dark:to-neutral-900/80">
        <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 border border-orange-100 dark:border-orange-900/20">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-center bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Authentication Error</h1>
          </div>
          
          <p className="text-neutral-700 dark:text-neutral-300 mb-6 text-center font-bold">{errorDescription}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 px-4 rounded-md transition-all duration-300 shadow-sm hover:shadow"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                // Set the redirect and force navigation
                setRedirectTo("/");
                // As a fallback, use direct navigation if React Router doesn't trigger
                setTimeout(() => {
                  window.location.href = "/";
                }, 100);
              }}
              className="w-full bg-white dark:bg-neutral-700 text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-600 font-medium py-3 px-4 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors shadow-sm"
            >
              Return Home
            </button>
          </div>
          
          {/* Create our own Dialog that mimics AuthModal but with controlled open state */}
          <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">
                  Continue with Google
                </DialogTitle>
                <DialogDescription className="text-center">
                  Join our community of founders and access exclusive content
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <AuthGoogleButtons />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-neutral-300 dark:border-neutral-600 border-t-neutral-800 dark:border-t-white rounded-full"></div>
        <p className="mt-4 text-lg text-neutral-700 dark:text-neutral-300">
          Completing authentication...
        </p>
      </div>
    </div>
  );
} 