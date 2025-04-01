import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { DocumentRepository } from '@/features/documents/repositories/documentRepository';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SignInForm() {
  const { signInWithGoogle, linkGoogleAccount, isAnonymous, user } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

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

  const handleGoogleSignIn = async () => {
    if (isAnonymous && hasDocuments) {
      setShowWarningDialog(true);
      return;
    }

    await performGoogleSignIn();
  };

  const performGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle(false); // Explicitly pass false to prevent linking
      
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleLoading(false);
      setShowWarningDialog(false);
    }
  };

  const performGoogleLinking = async () => {
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      const { error } = await linkGoogleAccount();
      
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred while linking your account. Please try again.');
    } finally {
      setIsGoogleLoading(false);
      setShowWarningDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isAnonymous && hasDocuments && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            Warning: You have unsaved documents. Signing in will create a new account and your current documents will be lost. Please use the Sign Up tab to save your work.
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Sign in with Google
          </>
        )}
      </Button>

      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warning: Unsaved Documents</DialogTitle>
            <DialogDescription>
              You have unsaved documents. There are two options:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li><strong>Link Account:</strong> Connect your Google account to your current documents (recommended)</li>
                <li><strong>Sign In Normally:</strong> Create a new account, losing your current documents</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={performGoogleSignIn}
              className="w-full sm:w-auto"
            >
              Sign In Normally
            </Button>
            <Button
              variant="default"
              onClick={performGoogleLinking}
              className="w-full sm:w-auto"
            >
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}