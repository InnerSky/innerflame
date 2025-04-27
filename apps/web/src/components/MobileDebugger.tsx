import { useEffect } from 'react';

/**
 * MobileDebugger component
 * 
 * Adds the Eruda mobile debugging console to the application
 * when in development mode. This allows for easier debugging
 * directly on mobile devices without requiring connection to a desktop.
 */
export function MobileDebugger() {
  useEffect(() => {
    // Only load in development mode
    if (process.env.NODE_ENV !== 'production') {
      // Create script element
      const script = document.createElement('script');
      script.src = '//cdn.jsdelivr.net/npm/eruda';
      script.async = true;
      
      // Initialize Eruda when script loads
      script.onload = () => {
        // @ts-ignore - Eruda is loaded globally
        window.eruda && window.eruda.init();
        
        // Optional: configure Eruda to your preferences
        // @ts-ignore
        window.eruda.scale(0.8); // Make the panel slightly smaller
        // @ts-ignore
        window.eruda.position({x: 'right', y: 'bottom'}); // Position the button
      };
      
      // Add script to document
      document.body.appendChild(script);
    }
    
    // Cleanup function to remove Eruda when component unmounts
    return () => {
      if (process.env.NODE_ENV !== 'production') {
        // @ts-ignore - Eruda is loaded globally
        if (window.eruda) {
          // @ts-ignore
          window.eruda.destroy();
        }
        
        // Find and remove the Eruda script
        const erudaScript = document.querySelector('script[src*="eruda"]');
        if (erudaScript && erudaScript.parentNode) {
          erudaScript.parentNode.removeChild(erudaScript);
        }
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 