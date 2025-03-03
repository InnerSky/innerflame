import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  useEffect(() => {
    // Check if we're back online
    const handleOnline = () => {
      window.location.reload();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 dark:bg-neutral-900 p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 dark:bg-orange-900/30">
          <WifiOff className="h-8 w-8 text-orange-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">You're Offline</h1>
        
        <p className="text-muted-foreground mb-8">
          It looks like you've lost your internet connection. 
          Don't worry, some content is still available while you're offline.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}