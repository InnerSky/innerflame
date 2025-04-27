import { useEffect, useState } from 'react';
import { MobileDebugger } from './MobileDebugger.js';

/**
 * DevTools component
 * 
 * This component conditionally renders development tools like
 * the mobile debugger based on the environment and device type.
 * It does nothing in production environments.
 */
export function DevTools() {
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Only render dev tools in development environment
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <>
      {/* Only render MobileDebugger on mobile devices */}
      {isMobile && <MobileDebugger />}
      
      {/* Add other dev tools here as needed */}
    </>
  );
} 