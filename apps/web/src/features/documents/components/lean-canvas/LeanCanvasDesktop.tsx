import React, { useMemo } from 'react';
import { Document } from '@/features/documents/models/document.js';
import { LeanCanvasDisplay } from './LeanCanvasDisplay.js';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, Check, X } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable.js';
import { ChatInterface, ChatInterfaceRef } from '@/features/documents/components/ChatInterface.js';
import { useDocumentsContext } from '@/features/documents/contexts/DocumentsContext.js';
import { useToast } from '@/hooks/use-toast.js';
import { restoreDocumentVersion } from '../../utils/versionRestorationUtils.js';

// Simple Overlay component for pending approval
function PendingApprovalOverlay({ onAccept, onReject, visible = true }: { 
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  visible?: boolean;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isRendered, setIsRendered] = React.useState(false);
  
  // Handle animation timing
  React.useEffect(() => {
    if (visible) {
      // First render the component
      setIsRendered(true);
      
      // Then trigger the slide-in animation after a tiny delay
      // This ensures the initial render happens with translateY(100%)
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      // Start exit animation
      setIsVisible(false);
      
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300); // Match transition duration
      
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
      toast({
        title: "Changes accepted",
        description: "The AI changes have been approved.",
      });
    } catch (error) {
      toast({
        title: "Error accepting changes",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject();
      toast({
        title: "Changes rejected",
        description: "Document has been restored to the previous version.",
      });
    } catch (error) {
      toast({
        title: "Error rejecting changes",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRendered) return null;

  return (
    <>
      {/* Semi-transparent overlay to indicate read-only state */}
      <div 
        className={`absolute inset-0 bg-background/5 pointer-events-none z-10 
          transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* Fixed buttons at the bottom of the viewport with animation */}
      <div 
        className={`fixed bottom-0 left-0 right-0 border-t border-border shadow-lg z-40 
          bg-gradient-to-r from-orange-500/80 via-rose-500/80 to-pink-500/80 backdrop-blur-md 
          transition-transform duration-300 ease-in-out transform
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="container mx-auto flex justify-center gap-4 p-4">
          <Button 
            variant="outline" 
            size="lg"
            disabled={isLoading}
            onClick={handleReject}
            className="min-w-32 bg-background/90 border-background/30 text-foreground hover:bg-background/100 hover:text-red-500"
          >
            <X className="mr-2 h-4 w-4 text-red-500" />
            Reject Changes
          </Button>
          <Button 
            variant="default" 
            size="lg"
            disabled={isLoading}
            onClick={handleAccept}
            className="min-w-32 bg-background/90 hover:bg-background/100 text-foreground hover:text-green-500"
          >
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Accept Changes
          </Button>
        </div>
      </div>
    </>
  );
}

// We still accept jsonData and onDataChange as props because LeanCanvasDisplay 
// needs the structured data and callback, not just raw document content
interface LeanCanvasDesktopProps {
  leanCanvas?: Document | null; // Optional now that we use context
  jsonData: Record<string, string> | null;
  onDataChange: (updatedData: Record<string, string>) => Promise<void>;
  chatInterfaceRef?: React.RefObject<ChatInterfaceRef>;
}

export function LeanCanvasDesktop({ 
  jsonData, 
  onDataChange,
  chatInterfaceRef
}: LeanCanvasDesktopProps) {
  // Use context to get document data
  const { 
    selectedDocument,
    acceptDocumentVersion,
    rejectDocumentVersion,
    selectDocument
  } = useDocumentsContext();
  const { toast } = useToast();

  // Check if the current version needs approval
  const isPendingApproval = useMemo(() => {
    if (!selectedDocument) {
      console.log('No selected document');
      return false;
    }
    
    // Check if the document has versions and if the current one needs approval
    if (selectedDocument.versions && selectedDocument.versions.length > 0) {
      const currentVersion = selectedDocument.versions.find(v => v.isCurrent);
      console.log('Found versions:', selectedDocument.versions.length, 'Current version:', currentVersion?.id);
      console.log('Approval status:', currentVersion?.approval_status);
      
      if (currentVersion?.approval_status === 'pending_approval') {
        console.log('Document needs approval');
        return true;
      }
    } else {
      console.log('No versions found on document');
    }
    
    return false;
  }, [selectedDocument]);

  // Handle accepting changes
  const handleAcceptChanges = async () => {
    if (!selectedDocument?.versions) return;
    
    // Find the current version
    const currentVersion = selectedDocument.versions.find(v => v.isCurrent);
    if (!currentVersion?.id) return;
    
    await acceptDocumentVersion(currentVersion.id);
  };

  // Handle rejecting changes
  const handleRejectChanges = async () => {
    if (!selectedDocument?.versions) return;
    
    // Find the current version
    const currentVersion = selectedDocument.versions.find(v => v.isCurrent);
    if (!currentVersion?.id || !currentVersion.base_version_id) return;
    
    // Use the utility function to restore to the base version (previous version)
    await restoreDocumentVersion({
      versionId: currentVersion.base_version_id,
      versionNumber: currentVersion.version_number - 1, // Previous version
      chatInterfaceRef, // This will now be used to find the triggering message
      selectDocument: (document) => selectDocument(document),
      successMessage: "Document has been restored to the previous version.",
      toast: toast,
      suppressToasts: true // Suppress restoration toasts since we already show a rejection toast
    });
  };

  // Memoize the canvas content to prevent unnecessary re-renders
  const canvasContent = useMemo(() => (
    <div className={`h-full flex flex-col ${isPendingApproval ? 'pb-24' : ''}`}>
      {!selectedDocument && (
        <div className="flex justify-end mb-4">
          <Link to="/documents">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Lean Canvas
            </Button>
          </Link>
        </div>
      )}

      {selectedDocument ? (
        <div className="px-5">
          <LeanCanvasDisplay 
            jsonData={jsonData} 
            onDataChange={onDataChange} 
            readOnly={isPendingApproval} // Make canvas read-only if pending approval
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 bg-gray-50 rounded-lg p-8 dark:bg-gray-900/50">
          <div className="text-xl text-center max-w-lg">
            You don't have a Lean Canvas yet. Create one from the Documents page.
          </div>
          <Link to="/documents">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Go to Documents
            </Button>
          </Link>
        </div>
      )}
    </div>
  ), [selectedDocument, jsonData, onDataChange, isPendingApproval]);

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={30} minSize={20} className="min-w-[250px] overflow-hidden px-1.5">
          {/* Use ChatInterface directly without adapter */}
          <ChatInterface 
            isStandalone={true}
            className="h-full"
            ref={chatInterfaceRef}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-muted hover:bg-primary/60 transition-colors [&>div]:h-6 [&>div]:w-4 [&>div]:bg-muted-foreground/30 [&>div]:hover:bg-primary/60" />
        <ResizablePanel defaultSize={70} minSize={20} className="min-w-[300px] overflow-hidden">
          <div className="h-full overflow-auto px-2 relative">
            {canvasContent}
            
            {/* Always render the overlay but control visibility with props */}
            <PendingApprovalOverlay 
              onAccept={handleAcceptChanges}
              onReject={handleRejectChanges}
              visible={isPendingApproval}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 