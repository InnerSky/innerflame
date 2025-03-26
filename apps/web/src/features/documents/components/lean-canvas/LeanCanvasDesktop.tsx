import React, { useMemo } from 'react';
import { Document } from '@/features/documents/models/document.js';
import { LeanCanvasDisplay } from './LeanCanvasDisplay.js';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable.js';
import { LeanCanvasChatAdapter } from './LeanCanvasChatAdapter.js';

interface LeanCanvasDesktopProps {
  leanCanvas: Document | null;
  jsonData: Record<string, string> | null;
  onDataChange: (updatedData: Record<string, string>) => Promise<void>;
}

export function LeanCanvasDesktop({ leanCanvas, jsonData, onDataChange }: LeanCanvasDesktopProps) {
  // Memoize the canvas content to prevent unnecessary re-renders
  const canvasContent = useMemo(() => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">
            {leanCanvas ? leanCanvas.title : 'Lean Canvas'}
          </h1>
        </div>
        {!leanCanvas && (
          <Link to="/documents">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Lean Canvas
            </Button>
          </Link>
        )}
      </div>

      {leanCanvas ? (
        <LeanCanvasDisplay 
          jsonData={jsonData} 
          onDataChange={onDataChange} 
          readOnly={false} 
        />
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
  ), [leanCanvas, jsonData, onDataChange]);

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={30} minSize={20} className="min-w-[250px] overflow-hidden">
          <LeanCanvasChatAdapter document={leanCanvas} />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-muted hover:bg-muted-foreground/20 transition-colors [&>div]:h-6 [&>div]:w-4 [&>div]:bg-muted-foreground/30 [&>div]:hover:bg-muted-foreground/60" />
        <ResizablePanel defaultSize={70} minSize={20} className="min-w-[300px] overflow-hidden">
          <div className="h-full overflow-auto px-2">
            {canvasContent}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 