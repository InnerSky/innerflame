import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext.js';
import { Document } from '@/features/documents/models/document.js';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Laptop } from 'lucide-react';
import { LeanCanvasDesktop } from '@/features/documents/components/lean-canvas/index.js';
import leanCanvasService from '@/features/documents/services/leanCanvasService.js';
import { useToast } from '@/hooks/use-toast.ts';
import { DocumentsProvider, useDocumentsContext } from '@/features/documents/contexts/DocumentsContext.js';
import { MessageContextType } from '@innerflame/types';

// This component receives the initial idea and is only rendered after DocumentsProvider is established
function LeanCanvasContent({ 
  initialIdea, 
  jsonData, 
  onDataChange,
  onIdeaProcessed,
  chatInterfaceRef
}: { 
  initialIdea?: string,
  jsonData: Record<string, string> | null, 
  onDataChange: (updatedData: Record<string, string>) => Promise<void>,
  onIdeaProcessed: () => void,
  chatInterfaceRef: React.RefObject<{ sendMessage: (content: string) => Promise<void> }>
}) {
  const { toast } = useToast();
  const [hasTriggeredAI, setHasTriggeredAI] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Now we can safely use DocumentsContext because we're inside the provider
  const { selectedDocument } = useDocumentsContext();

  // Handle AI initialization
  useEffect(() => {
    if (initialIdea && selectedDocument && !hasTriggeredAI && !loading && chatInterfaceRef.current) {
      const triggerAI = async () => {
        try {
          // Mark that we've triggered the AI to avoid duplicate messages
          setHasTriggeredAI(true);
          
          // Show toast notification
          toast({
            title: "AI Assistant",
            description: "I'll help you fill out your Lean Canvas based on your idea.",
          });
          
          // Send message using the chat interface ref
          if (chatInterfaceRef.current) {
            await chatInterfaceRef.current.sendMessage(
              `Help me create a lean canvas for this startup idea: ${initialIdea}`
            );
            
            console.log('Initial lean canvas prompt sent via ChatInterface for:', initialIdea);
          }
          
          // Let parent know we've processed the idea so location state can be cleared
          onIdeaProcessed();
        } catch (error) {
          console.error('Error sending initial lean canvas prompt:', error);
          // Still mark as processed to prevent retries on error
          onIdeaProcessed();
        }
      };
      
      // Short delay to ensure everything is ready
      const timer = setTimeout(triggerAI, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [initialIdea, selectedDocument, hasTriggeredAI, loading, chatInterfaceRef, toast, onIdeaProcessed]);

  return (
    <div className="absolute inset-0">
      <LeanCanvasDesktop 
        jsonData={jsonData}
        onDataChange={onDataChange}
        chatInterfaceRef={chatInterfaceRef}
      />
    </div>
  );
}

export default function LeanCanvas() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initialIdea = location.state?.initialIdea;
  
  // Create a ref to the ChatInterface component
  const chatInterfaceRef = useRef<{ sendMessage: (content: string) => Promise<void> }>(null);
  
  // Document state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [jsonData, setJsonData] = useState<Record<string, string> | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'unsaved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [contentFormat, setContentFormat] = useState<any>('json');
  const [documentVersions, setDocumentVersions] = useState<any[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Project state (needed for context but not used in LeanCanvas)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectsData, setProjectsData] = useState<Record<string, string>>({});

  // Function to clear the location state after idea is processed
  const handleIdeaProcessed = useCallback(() => {
    if (location.state?.initialIdea) {
      // Replace current entry in history with the same URL but without the state
      navigate(location.pathname, { replace: true });
      console.log('Cleared initialIdea from location state to prevent reprocessing on refresh');
    }
  }, [location.pathname, location.state?.initialIdea, navigate]);

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

  // Load the lean canvas document
  useEffect(() => {
    async function fetchLeanCanvas() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use the service to get the most recent lean canvas
        const mostRecentLeanCanvas = await leanCanvasService.getMostRecentLeanCanvas(user.id);
        
        if (mostRecentLeanCanvas) {
          // Set the document state
          setSelectedDocument(mostRecentLeanCanvas);
          setTitle(mostRecentLeanCanvas.title);
          setContent(mostRecentLeanCanvas.content || '');
          setLastSaved(mostRecentLeanCanvas.updatedAt ? new Date(mostRecentLeanCanvas.updatedAt) : null);
          
          // Parse the JSON content
          try {
            const parsedContent = mostRecentLeanCanvas.content ? 
              JSON.parse(mostRecentLeanCanvas.content) : null;
            setJsonData(parsedContent);
          } catch (parseError) {
            console.error('Error parsing lean canvas content:', parseError);
            setError('Could not parse the lean canvas data.');
          }
        } else {
          // No lean canvas found
          setError('No Lean Canvas found. Please create one first.');
        }
      } catch (fetchError) {
        console.error('Error fetching lean canvas:', fetchError);
        setError('Failed to load your lean canvas. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchLeanCanvas();
  }, [user?.id]);

  // Document operations - define these before using them in context
  const selectDocument = useCallback((document: Document) => {
    setSelectedDocument(document);
    setTitle(document.title);
    setContent(document.content || '');
    setSaveStatus('idle');
    setHasUnsavedChanges(false);
    setLastSaved(document.updatedAt ? new Date(document.updatedAt) : null);
  }, []);

  const selectProject = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
  }, []);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  const handleSetTitle = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  }, []);

  const handleSetContent = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  }, []);

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

  const fetchDocumentVersions = useCallback(async (documentId: string) => {
    // Implement version fetching if needed for LeanCanvas
    setDocumentVersions([]);
  }, []);

  const handleVersionHistoryClick = useCallback(() => {
    // Implement if needed for LeanCanvas
  }, []);

  const updateDocumentType = useCallback(async (type: any) => {
    // Implement if needed for LeanCanvas
  }, []);

  const updateContentFormat = useCallback(async (format: any) => {
    setContentFormat(format);
  }, []);
  
  // Parse JSON content whenever it changes
  useEffect(() => {
    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        setJsonData(parsedContent);
      } catch (parseError) {
        console.error('Error parsing lean canvas content:', parseError);
        setError('Could not parse the lean canvas data.');
      }
    }
  }, [content]);

  // Handle data changes from the canvas
  const handleDataChange = async (updatedData: Record<string, string>) => {
    if (!selectedDocument || !user?.id) return;
    
    try {
      // Update content
      const newContent = JSON.stringify(updatedData);
      setContent(newContent);
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      
      // Update local state for immediate UI feedback
      setJsonData(updatedData);
    } catch (saveError) {
      console.error('Error updating lean canvas data:', saveError);
      setError('Failed to update your changes. Please try again.');
    }
  };
  
  // Create documents context value
  const documentsContextValue = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading your Lean Canvas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="text-lg text-red-500">{error}</div>
        <Link to="/documents">
          <Button variant="outline">Back to Documents</Button>
        </Link>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Laptop className="h-16 w-16 mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold mb-2">Desktop View Recommended</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Mobile layout coming soon. Please use a desktop device to view and edit your Lean Canvas.
        </p>
        <Link to="/documents">
          <Button>Return to Documents</Button>
        </Link>
      </div>
    );
  }

  return (
    <DocumentsProvider value={documentsContextValue}>
      <LeanCanvasContent 
        initialIdea={initialIdea}
        jsonData={jsonData}
        onDataChange={handleDataChange}
        onIdeaProcessed={handleIdeaProcessed}
        chatInterfaceRef={chatInterfaceRef}
      />
    </DocumentsProvider>
  );
} 