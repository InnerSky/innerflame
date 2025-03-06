import { DocumentVersion } from "../models/document";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface VersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: DocumentVersion[];
  viewingIndex: number;
  onChangeIndex: (index: number) => void;
  onActivateVersion: (version: DocumentVersion) => void;
}

export function VersionHistoryModal({
  open,
  onOpenChange,
  versions,
  viewingIndex,
  onChangeIndex,
  onActivateVersion,
}: VersionHistoryModalProps) {
  if (versions.length === 0) return null;
  
  const currentVersion = versions[viewingIndex];
  const isCurrentActive = currentVersion?.isCurrent === true;
  const totalVersions = versions.length;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            Browse through previous versions of this document
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeIndex(Math.min(viewingIndex + 1, totalVersions - 1))}
              disabled={viewingIndex >= totalVersions - 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeIndex(Math.max(viewingIndex - 1, 0))}
              disabled={viewingIndex <= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Version {currentVersion.versionNumber} of {totalVersions}
            </span>
          </div>
          
          <Badge variant={isCurrentActive ? "default" : "outline"}>
            {isCurrentActive ? "Current Version" : "Historical Version"}
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground mb-2">
          Created on {currentVersion.createdAt.toLocaleString()}
        </div>
        
        <div className="flex-grow overflow-auto border rounded-md p-4 bg-card">
          <h3 className="text-xl font-semibold mb-4">{currentVersion.content.title}</h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {currentVersion.content.content ? (
              <MarkdownRenderer content={currentVersion.content.content} />
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          
          {!isCurrentActive && (
            <Button
              onClick={() => onActivateVersion(currentVersion)}
            >
              Make Active
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 