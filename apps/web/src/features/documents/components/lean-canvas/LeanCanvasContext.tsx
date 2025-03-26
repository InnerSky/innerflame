import React, { createContext, useContext, ReactNode } from 'react';
import { Document, DocumentType } from '@/features/documents/models/document.js';

interface LeanCanvasContextProps {
  leanCanvas: Document | null;
  selectedDocument: Document | null;
}

const LeanCanvasContext = createContext<LeanCanvasContextProps>({
  leanCanvas: null,
  selectedDocument: null,
});

interface LeanCanvasProviderProps {
  children: ReactNode;
  leanCanvas: Document | null;
}

export function LeanCanvasProvider({ children, leanCanvas }: LeanCanvasProviderProps) {
  // Make the leanCanvas document available as the selectedDocument for the ChatInterface
  const contextValue = {
    leanCanvas,
    selectedDocument: leanCanvas,
  };

  return (
    <LeanCanvasContext.Provider value={contextValue}>
      {children}
    </LeanCanvasContext.Provider>
  );
}

export function useLeanCanvasContext() {
  return useContext(LeanCanvasContext);
} 