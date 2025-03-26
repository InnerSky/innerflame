import { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Save, Eye, FileEdit, History, FileType, Code, Copy, Check } from 'lucide-react';
import { SaveStatus, DocumentType, ContentFormat } from '../models/document';
import { countWords } from '@/utils/textUtils';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { ContentFormatSelector } from './ContentFormatSelector';
import { JSONEditor } from './JSONEditor';
import { JSONDisplay } from './JSONDisplay';
import { LeanCanvasDisplay } from './lean-canvas';

interface DocumentEditorProps {
  title: string;
  content: string;
  isPreviewMode: boolean;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  versionNumber?: number;
  hasUnsavedChanges: boolean;
  documentType: DocumentType;
  contentFormat: ContentFormat;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onVersionHistoryClick: () => void;
  onDocumentTypeChange?: (type: DocumentType) => void;
  onContentFormatChange?: (format: ContentFormat) => void;
}

// Add this helper function to safely parse JSON
const tryParseJSON = (jsonString: string): Record<string, string> | null => {
  try {
    const parsed = JSON.parse(jsonString);
    // Ensure it's an object and convert all values to strings
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
    }
    return null;
  } catch (e) {
    return null;
  }
};

export function DocumentEditor({
  title,
  content,
  isPreviewMode,
  saveStatus,
  lastSaved,
  versionNumber,
  hasUnsavedChanges,
  documentType,
  contentFormat,
  onTitleChange,
  onContentChange,
  onTogglePreview,
  onSave,
  onVersionHistoryClick,
  onDocumentTypeChange,
  onContentFormatChange,
}: DocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState<DocumentType>(documentType);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [newContentFormat, setNewContentFormat] = useState<ContentFormat>(contentFormat);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Add keyboard shortcut handler for Ctrl+Enter and Shift+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Enter or Shift+Enter
      if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
        // Only save if the save button is active (has unsaved changes and not currently saving)
        if (hasUnsavedChanges && saveStatus !== 'saving') {
          e.preventDefault(); // Prevent default behavior like new line in textarea
          onSave();
        }
      }
    };

    // Add the event listener to the document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasUnsavedChanges, saveStatus, onSave]);

  // Add copy functionality
  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      
      // Reset the copy success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy content: ', err);
    }
  };

  // Handle JSON data changes from the JSONDisplay component
  const handleJSONDataChange = (updatedData: Record<string, string>) => {
    // Convert the updated data back to a JSON string
    const updatedContent = JSON.stringify(updatedData, null, 2);
    onContentChange(updatedContent);
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-muted-foreground flex items-center">
            <span className="h-4 w-4 mr-1 rounded-full border-2 border-t-transparent border-muted-foreground animate-spin"></span>
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="text-green-500 flex items-center">
            Saved {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}
          </span>
        );
      case 'error':
        return <span className="text-red-500">Error saving</span>;
      case 'unsaved':
        return <span className="text-amber-500">Autosaving soon...</span>;
      default:
        return null;
    }
  };
  
  // Convert enum to readable label 
  const getDocumentTypeLabel = (type: DocumentType): string => {
    switch (type) {
      case DocumentType.UserDocument:
        return "User Document";
      case DocumentType.Canvas:
        return "Canvas";
      case DocumentType.Project:
        return "Project";
      case DocumentType.JournalEntry:
        return "Journal Entry";
      case DocumentType.FuturePressRelease:
        return "Future Press Release";
      case DocumentType.LeanCanvas:
        return "Lean Canvas";
      case DocumentType.SalesPage:
        return "Sales Page";
      default:
        return String(type).replace(/([A-Z])/g, ' $1').trim();
    }
  };

  // Reset the new document type whenever the document type changes
  useEffect(() => {
    setNewDocumentType(documentType);
  }, [documentType]);

  useEffect(() => {
    setNewContentFormat(contentFormat);
  }, [contentFormat]);

  const handleSaveDocumentType = () => {
    if (onDocumentTypeChange && newDocumentType !== documentType) {
      onDocumentTypeChange(newDocumentType);
    }
    setDialogOpen(false);
  };

  const handleSaveContentFormat = () => {
    if (onContentFormatChange && newContentFormat !== contentFormat) {
      onContentFormatChange(newContentFormat);
    }
    setFormatDialogOpen(false);
  };

  // Add this function to get format label
  const getContentFormatLabel = (format: ContentFormat): string => {
    switch (format) {
      case ContentFormat.Markdown:
        return 'Markdown';
      case ContentFormat.JSON:
        return 'JSON';
      case ContentFormat.HTML:
        return 'HTML';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card sm:p-4 p-3 sm:rounded-md sm:border">
      <div className="flex justify-between items-center mb-2 sm:mb-4 p-0.5">
        <div className="flex-1 mr-2 sm:mr-4">
          <Input
            className="text-lg sm:text-xl font-semibold px-2 py-1 sm:px-3 sm:py-2 h-8 sm:h-10"
            placeholder="Document Title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePreview}
          className="flex items-center gap-1 h-8 sm:h-9 rounded-md ml-1"
          aria-label={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
        >
          {isPreviewMode ? (
            <>
              <FileEdit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </>
          )}
        </Button>
      </div>
      
      {isPreviewMode ? (
        <div className="flex-grow overflow-auto bg-card rounded-md border p-3 sm:p-4">
          {contentFormat === ContentFormat.JSON ? (
            documentType === DocumentType.LeanCanvas ? (
              <LeanCanvasDisplay 
                jsonData={tryParseJSON(content)} 
                onDataChange={handleJSONDataChange}
              />
            ) : (
              <JSONDisplay 
                jsonData={tryParseJSON(content)} 
                onDataChange={handleJSONDataChange}
              />
            )
          ) : contentFormat === ContentFormat.HTML ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </div>
      ) : (
        contentFormat === ContentFormat.JSON ? (
          <div className="flex-grow flex flex-col overflow-auto p-0.5 pb-1.5">
            <JSONEditor 
              jsonData={tryParseJSON(content)} 
              onChange={(data) => onContentChange(JSON.stringify(data, null, 2))}
            />
          </div>
        ) : (
          <div className="p-0.5 pb-1.5 flex-grow">
            <Textarea
              ref={textareaRef}
              className="flex-grow min-h-0 font-mono resize-none transition-shadow duration-200 focus:shadow-md overflow-auto w-full h-full"
              placeholder="Document content..."
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
            />
          </div>
        )
      )}
      
      <div className="mt-1 sm:mt-2 text-xs text-muted-foreground flex flex-wrap gap-1 sm:gap-2 justify-between items-center">
        {/* Left side buttons */}
        <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
          {onDocumentTypeChange && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-1 sm:px-2 text-xs flex items-center">
                  <FileType className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate max-w-[60px] sm:max-w-none">{getDocumentTypeLabel(documentType)}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Document Type</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <DocumentTypeSelector
                    value={newDocumentType}
                    onChange={setNewDocumentType}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDocumentType}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Content Format Selector */}
          {onContentFormatChange && (
            <Dialog open={formatDialogOpen} onOpenChange={setFormatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-1 sm:px-2 text-xs flex items-center">
                  <Code className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate max-w-[60px] sm:max-w-none">{getContentFormatLabel(contentFormat)}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Content Format</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <ContentFormatSelector
                    value={newContentFormat}
                    onChange={setNewContentFormat}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFormatDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveContentFormat}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Right side elements */}
        <div className="flex flex-wrap gap-1 sm:gap-2 items-center ml-auto">
          {/* Copy button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 sm:h-8 px-1 sm:px-2 text-xs"
            onClick={handleCopyContent}
            title="Copy document content"
          >
            {copySuccess ? (
              <Check className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" />
            ) : (
              <Copy className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
            <span className="hidden sm:inline">Copy</span>
          </Button>
          
          {versionNumber !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 sm:h-8 px-1 sm:px-2 text-xs"
              onClick={onVersionHistoryClick}
            >
              <History className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>v{versionNumber}</span>
            </Button>
          )}
          
          {renderSaveStatus()}
          {hasUnsavedChanges && (
            <Button 
              onClick={onSave}
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-3"
              disabled={saveStatus === 'saving'}
            >
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 