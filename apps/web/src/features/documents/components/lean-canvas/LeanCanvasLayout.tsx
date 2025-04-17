import React, { useState, useEffect } from 'react';
import { LeanCanvasDesktop } from './LeanCanvasDesktop.js';
import { LeanCanvasMobile } from './LeanCanvasMobile.js';
import { ChatInterfaceRef } from '@/features/documents/components/ChatInterface.js';

interface LeanCanvasLayoutProps {
  jsonData: Record<string, string> | null;
  onDataChange: (updatedData: Record<string, string>) => Promise<void>;
  chatInterfaceRef?: React.RefObject<ChatInterfaceRef>;
}

export function LeanCanvasLayout({ 
  jsonData, 
  onDataChange,
  chatInterfaceRef
}: LeanCanvasLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render appropriate layout based on screen size
  if (isMobile) {
    return (
      <LeanCanvasMobile
        jsonData={jsonData}
        onDataChange={onDataChange}
        chatInterfaceRef={chatInterfaceRef}
      />
    );
  }
  
  return (
    <LeanCanvasDesktop
      jsonData={jsonData}
      onDataChange={onDataChange}
      chatInterfaceRef={chatInterfaceRef}
    />
  );
}