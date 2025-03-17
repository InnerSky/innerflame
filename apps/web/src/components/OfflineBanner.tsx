import { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOffline(!navigator.onLine);

    // Add event listeners for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
      <div className="flex items-center">
        <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="ml-2 text-orange-600 dark:text-orange-400">
          You're currently offline. Some features may be unavailable.
        </AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="h-7 border-orange-200 bg-orange-100 hover:bg-orange-200 dark:border-orange-800 dark:bg-orange-900 dark:hover:bg-orange-800"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDismiss}
          className="h-7 text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Alert>
  );
}