import React, { useMemo } from 'react';
import { Document } from '@/features/documents/models/document.js';
import { LeanCanvasDisplay } from './LeanCanvasDisplay.js';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable.js';
import { ChatInterface } from '@/features/documents/components/ChatInterface.js';
import { useDocumentsContext } from '@/features/documents/contexts/DocumentsContext.js';

// We still accept jsonData and onDataChange as props because LeanCanvasDisplay 
// needs the structured data and callback, not just raw document content
interface LeanCanvasDesktopProps {
  leanCanvas?: Document | null; // Optional now that we use context
  jsonData: Record<string, string> | null;
  onDataChange: (updatedData: Record<string, string>) => Promise<void>;
  chatInterfaceRef?: React.RefObject<{
    sendMessage: (content: string) => Promise<void>;
  }>;
}

export function LeanCanvasDesktop({ 
  jsonData, 
  onDataChange,
  chatInterfaceRef
}: LeanCanvasDesktopProps) {
  // Use context to get document data
  const { selectedDocument } = useDocumentsContext();

  // Memoize the canvas content to prevent unnecessary re-renders
  const canvasContent = useMemo(() => (
    <div className="h-full flex flex-col">
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
            readOnly={false} 
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
  ), [selectedDocument, jsonData, onDataChange]);

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
          <div className="h-full overflow-auto px-2">
            {canvasContent}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 