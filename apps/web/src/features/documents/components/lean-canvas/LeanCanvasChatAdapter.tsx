import React, { useMemo, useRef } from 'react';
import { Document } from '@/features/documents/models/document.js';
import { ChatInterface } from '../ChatInterface.js';
import { DocumentsProvider } from '@/features/documents/contexts/DocumentsContext.js';

/**
 * Custom hook to manage chat integration with LeanCanvas
 */
export function useLeanCanvasChat(leanCanvas: Document | null) {
  // Use refs to prevent recreation of callback functions
  const callbacksRef = useRef({
    saveDocument: async () => {},
    selectDocument: () => {},
    selectProject: () => {},
    setTitle: () => {},
    setContent: () => {},
    togglePreviewMode: () => {},
    updateDocumentType: async () => {},
    updateContentFormat: async () => {},
    fetchDocumentVersions: async () => {},
    handleVersionHistoryClick: () => {},
    acceptDocumentVersion: async () => {},
    rejectDocumentVersion: async () => {}
  });

  // Memoize the DocumentsContext value to prevent recreation on each render
  const contextValue = useMemo(() => ({
    selectedDocument: leanCanvas,
    title: leanCanvas?.title || '',
    content: leanCanvas?.content || '',
    isPreviewMode: false,
    saveStatus: 'idle' as const,
    lastSaved: leanCanvas?.updatedAt || null,
    hasUnsavedChanges: false,
    contentFormat: 'json',
    documentVersions: [],
    selectedProjectId: null,
    projectsData: {},
    // Use stable function references from ref
    saveDocument: callbacksRef.current.saveDocument,
    selectDocument: callbacksRef.current.selectDocument,
    selectProject: callbacksRef.current.selectProject,
    setTitle: callbacksRef.current.setTitle,
    setContent: callbacksRef.current.setContent,
    togglePreviewMode: callbacksRef.current.togglePreviewMode,
    updateDocumentType: callbacksRef.current.updateDocumentType,
    updateContentFormat: callbacksRef.current.updateContentFormat,
    fetchDocumentVersions: callbacksRef.current.fetchDocumentVersions,
    handleVersionHistoryClick: callbacksRef.current.handleVersionHistoryClick,
    acceptDocumentVersion: callbacksRef.current.acceptDocumentVersion,
    rejectDocumentVersion: callbacksRef.current.rejectDocumentVersion
  }), [leanCanvas]); // Only re-create when leanCanvas changes
  
  return { contextValue };
}

/**
 * Adapter component that provides the necessary context for ChatInterface when used with LeanCanvas
 */
export function LeanCanvasChatAdapter({ document }: { document: Document | null }) {
  const { contextValue } = useLeanCanvasChat(document);
  
  // Only render the chat when we have a document
  if (!document) return null;

  return (
    <DocumentsProvider value={contextValue}>
      <div className="h-full overflow-auto" style={{ maxHeight: "100%" }}>
        <ChatInterface isStandalone={false} className="h-full" />
      </div>
    </DocumentsProvider>
  );
} 