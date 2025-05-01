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
  
  // Ensure we don't render in production environments using multiple checks
  const isProd = 
    process.env.NODE_ENV === 'production' || 
    import.meta.env.PROD === true || 
    import.meta.env.MODE === 'production';
  
  if (isProd) {
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