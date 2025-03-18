import React, { createContext, useContext, ReactNode } from 'react';
import { Document } from '../models/document.js';

// Add the save status type to match what's used in Documents.tsx
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

// Define the context shape
interface DocumentsContextType {
  // Document state
  selectedDocument: Document | null;
  title: string;
  content: string;
  isPreviewMode: boolean;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  contentFormat: string | any; // Updated to handle multiple types
  documentVersions: any[]; // Define proper type based on your data model
  
  // Project state
  selectedProjectId: string | null;
  projectsData: Record<string, string>;
  
  // Operations
  saveDocument: () => Promise<void>;
  selectDocument: (document: Document) => void;
  selectProject: (projectId: string | null) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  togglePreviewMode: () => void;
  updateDocumentType: (type: any) => Promise<void>; // Updated to match implementation
  updateContentFormat: (format: any) => Promise<void>; // Updated to match implementation
  fetchDocumentVersions: (documentId: string) => Promise<void>;
  handleVersionHistoryClick: () => void;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children, value }: { children: ReactNode, value: DocumentsContextType }) {
  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocumentsContext() {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error('useDocumentsContext must be used within a DocumentsProvider');
  }
  return context;
} 