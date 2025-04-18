import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Info } from 'lucide-react';
import { DocumentRepository } from '@/features/documents/repositories/documentRepository';
import { supabase } from '@/lib/supabase.js';
import { anonymousAuthService } from '@/features/auth/services/anonymousAuthService.js';

export function SignUpForm() {
  const { signInWithGoogle, isAnonymous, user } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDocuments, setHasDocuments] = useState(false);

  useEffect(() => {
    const checkForDocuments = async () => {
      if (!isAnonymous || !user?.id) return;
      
      try {
        const repository = new DocumentRepository();
        const documents = await repository.getUserDocuments(user.id);
        setHasDocuments(documents.length > 0);
      } catch (err) {
        console.error('Error checking for documents:', err);
      }
    };

    checkForDocuments();
  }, [isAnonymous, user?.id]);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      if (isAnonymous) {
        // For anonymous users, use the enhanced conversion method
        // Store the user ID before conversion to ensure we update the right profile
        if (user?.id) {
          localStorage.setItem('profileUpdateUserId', user.id);
          localStorage.setItem('pendingProfileUpdate', 'true');
        }
        
        // Use the dedicated conversion method if available, otherwise fall back
        if (anonymousAuthService.convertAnonymousToRegisteredUser) {
          const { success, error } = await anonymousAuthService.convertAnonymousToRegisteredUser('google');
          
          if (error) {
            setError(error.message);
          }
        } else {
          // Legacy fallback to signInWithGoogle
          const { error } = await signInWithGoogle(true);
          
          if (error) {
            setError(error.message);
          }
        }
      } else {
        // For new sign-ups (not anonymous), clear any existing sessions first
        // This helps prevent conflicts with any lingering anonymous sessions
        await supabase.auth.signOut({ scope: 'global' });
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-lpxnyybizytwcqdqasll-auth-token');
        
        // Then proceed with the regular sign-in
        const { error } = await signInWithGoogle(false);
        
        if (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isAnonymous && (
        <Alert className={hasDocuments ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
          {hasDocuments ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Great! Sign up to save your work and access it anytime. Your existing data will be preserved.
              </AlertDescription>
            </>
          ) : (
            <>
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                Sign up to create a permanent account. You'll be able to access your work from any device.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full"
        onClick={handleGoogleSignUp}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isAnonymous ? "Linking your account..." : "Connecting..."}
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            {isAnonymous ? (hasDocuments ? 'Save Your Work with Google' : 'Sign Up with Google') : 'Sign Up with Google'}
          </>
        )}
      </Button>
    </div>
  );
}