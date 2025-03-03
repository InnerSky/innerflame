import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get the session from the URL hash params
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          return;
        }
        
        // Redirect to the home page on successful authentication
        navigate("/");
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred during authentication");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-8 px-4 py-8 sm:px-6">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
              Authentication Error
            </h2>
            <p className="mt-2 text-center text-red-500">{error}</p>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Authenticating...
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Please wait while we complete your authentication.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
} 