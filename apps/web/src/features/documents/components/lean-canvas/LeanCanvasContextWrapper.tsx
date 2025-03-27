import React, { useState, useCallback, useEffect } from 'react';
import { DocumentsProvider } from '@/features/documents/contexts/DocumentsContext.js';
import { Document } from '@/features/documents/models/document.js';
import leanCanvasService from '@/features/documents/services/leanCanvasService.js';
import { MessageService } from '@/features/documents/services/messageService.js';
import { useToast } from '@/hooks/use-toast.ts';
import { MessageContextType, MessageSenderType } from '@/features/documents/models/message.js';
import { useAuth } from '@/contexts/AuthContext.js';

interface LeanCanvasContextWrapperProps {
  children: React.ReactNode;
  initialIdea?: string;
}

export function LeanCanvasContextWrapper({ children, initialIdea }: LeanCanvasContextWrapperProps) {
  // Document state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'unsaved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [contentFormat, setContentFormat] = useState<any>('json');
  const [documentVersions, setDocumentVersions] = useState<any[]>([]);
  const [hasTriggeredAI, setHasTriggeredAI] = useState<boolean>(false);
  
  // Project state (not really used for LeanCanvas but needed for context)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectsData, setProjectsData] = useState<Record<string, string>>({});
  
  // Get user info
  const { user } = useAuth();
  
  // Toast notifications
  const { toast } = useToast();

  // Select document and update state
  const selectDocument = useCallback((document: Document) => {
    setSelectedDocument(document);
    setTitle(document.title);
    setContent(document.content || '');
    setSaveStatus('idle');
    setHasUnsavedChanges(false);
    setLastSaved(document.updatedAt ? new Date(document.updatedAt) : null);
  }, []);

  // Handle AI initialization when document is loaded
  useEffect(() => {
    // Only proceed if we have an initial idea, a document, and haven't triggered AI yet
    if (initialIdea && selectedDocument && !hasTriggeredAI && user?.id) {
      const sendInitialPrompt = async () => {
        try {
          // Mark that we've triggered the AI to avoid duplicate messages
          setHasTriggeredAI(true);
          
          // Show toast notification
          toast({
            title: "AI Assistant",
            description: "I'll help you fill out your Lean Canvas based on your idea.",
          });
          
          // Create the message using MessageService
          await MessageService.createMessage({
            content: `Help me create a lean canvas for this startup idea: ${initialIdea}`,
            userId: user.id,
            senderType: MessageSenderType.User,
            contextType: MessageContextType.Document,
            contextId: selectedDocument.id
          });
          
          console.log('Initial lean canvas prompt sent for:', initialIdea);
        } catch (error) {
          console.error('Error sending initial lean canvas prompt:', error);
        }
      };
      
      // Short delay to ensure everything is ready
      const timer = setTimeout(sendInitialPrompt, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [initialIdea, selectedDocument, hasTriggeredAI, toast, user?.id]);

  // Select project (not typically used in LeanCanvas but needed for context)
  const selectProject = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
  }, []);

  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  // Update document title
  const handleSetTitle = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  }, []);

  // Update document content
  const handleSetContent = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  }, []);

  // Save document
  const saveDocument = useCallback(async () => {
    if (!selectedDocument) return;
    
    try {
      setSaveStatus('saving');
      
      // Use the leanCanvasService to save the document
      const parsedContent = JSON.parse(content);
      const updatedDocument = await leanCanvasService.saveLeanCanvas(
        selectedDocument.id,
        title,
        parsedContent
      );
      
      // Update state with saved document
      setSelectedDocument(updatedDocument);
      setLastSaved(new Date());
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving document:', error);
      setSaveStatus('error');
    }
  }, [selectedDocument, content, title]);

  // Fetch document versions (simplified - expand as needed)
  const fetchDocumentVersions = useCallback(async (documentId: string) => {
    // Implement version fetching if needed for LeanCanvas
    setDocumentVersions([]);
  }, []);

  // Handle version history click
  const handleVersionHistoryClick = useCallback(() => {
    // Implement if needed for LeanCanvas
  }, []);

  // Update document type (simplified - expand as needed)
  const updateDocumentType = useCallback(async (type: any) => {
    // Implement if needed for LeanCanvas
  }, []);

  // Update content format (simplified - expand as needed)
  const updateContentFormat = useCallback(async (format: any) => {
    setContentFormat(format);
  }, []);

  // Create context value
  const contextValue = {
    // Document state
    selectedDocument,
    title,
    content,
    isPreviewMode,
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    contentFormat,
    documentVersions,
    
    // Project state
    selectedProjectId,
    projectsData,
    
    // Operations
    saveDocument,
    selectDocument,
    selectProject,
    setTitle: handleSetTitle,
    setContent: handleSetContent,
    togglePreviewMode,
    updateDocumentType,
    updateContentFormat,
    fetchDocumentVersions,
    handleVersionHistoryClick
  };

  return (
    <DocumentsProvider value={contextValue}>
      {children}
    </DocumentsProvider>
  );
} 