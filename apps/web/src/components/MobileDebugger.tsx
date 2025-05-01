import { useEffect } from 'react';

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    __ERUDA_INITIALIZED__?: boolean;
    eruda?: {
      init: () => void;
      scale: (value: number) => void;
      position: (options: {x: string; y: string}) => void;
    };
  }
}

/**
 * MobileDebugger component
 * 
 * Adds the Eruda mobile debugging console to the application
 * when in development mode. This allows for easier debugging
 * directly on mobile devices without requiring connection to a desktop.
 */
export function MobileDebugger() {
  useEffect(() => {
    // More robust environment detection for Vite applications
    const isProd = 
      process.env.NODE_ENV === 'production' || 
      import.meta.env.PROD === true || 
      import.meta.env.MODE === 'production';
    
    // Only load in development mode
    if (!isProd) {
      // Check if Eruda is already initialized by:
      // 1. Looking for our global flag
      // 2. Looking for Eruda's DOM elements in the document
      // 3. Checking if the eruda object exists in window
      const isErudaInitialized = 
        window.__ERUDA_INITIALIZED__ || 
        document.querySelector('#eruda') ||
        document.querySelector('.eruda-container') ||
        'eruda' in window;
        
      if (isErudaInitialized) {
        return;
      }
      
      // Immediately mark as initialized to prevent duplicate initializations
      // even before the script loads (helps with HMR race conditions)
      window.__ERUDA_INITIALIZED__ = true;
      
      // Create script element
      const script = document.createElement('script');
      script.src = '//cdn.jsdelivr.net/npm/eruda';
      script.async = true;
      script.id = 'eruda-script'; // Add ID for easier detection
      
      // Initialize Eruda when script loads
      script.onload = () => {
        // Double-check Eruda isn't already initialized
        if (window.eruda && !document.querySelector('.eruda-container')) {
          window.eruda.init();
          
          // Optional: configure Eruda to your preferences
          window.eruda.scale(0.8); // Make the panel slightly smaller
          window.eruda.position({x: 'right', y: 'bottom'}); // Position the button
        }
      };
      
      // Add script to document
      document.body.appendChild(script);
    }
    
    // Cleanup function
    return () => {
      // No cleanup needed - we want Eruda to persist even if this component unmounts
      // Removing Eruda would disrupt debugging and HMR would just re-add it
      // This prevents flickering during development
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 