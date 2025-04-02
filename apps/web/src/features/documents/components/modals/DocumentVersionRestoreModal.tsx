import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LeanCanvasDisplay } from '../lean-canvas/LeanCanvasDisplay.js';
import { cn } from '@/lib/utils';

interface DocumentVersionRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestore: () => void;
  versionId: string | null;
  versionNumber?: number;
  versionData: Record<string, string> | null;
}

export function DocumentVersionRestoreModal({
  isOpen,
  onClose,
  onConfirmRestore,
  versionId,
  versionNumber,
  versionData
}: DocumentVersionRestoreModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 max-w-[95vw] w-[95vw] h-[95vh] translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg overflow-hidden'
          )}
        >
          <div className="flex flex-col h-full bg-background">
            {/* Fixed Header */}
            <div className="border-b bg-background p-4 flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">Restore Document Version</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Document version: {versionNumber || '—'}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={onConfirmRestore} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Restore This Version
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content - Direct child of DialogContent */}
            <div className="overflow-y-auto" style={{ height: "calc(95vh - 85px)" }}>
              <div className="p-4">
                {versionData ? (
                  <div className="bg-card rounded-lg shadow-sm border">
                    <div className="p-4">
                      <LeanCanvasDisplay
                        jsonData={versionData}
                        readOnly={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading document version...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
} 