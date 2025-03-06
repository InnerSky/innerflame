import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Save, Eye, FileEdit, History } from 'lucide-react';
import { SaveStatus } from '../models/document';
import { countWords } from '@/utils/textUtils';

interface DocumentEditorProps {
  title: string;
  content: string;
  isPreviewMode: boolean;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  versionNumber?: number;
  hasUnsavedChanges: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onVersionHistoryClick: () => void;
}

export function DocumentEditor({
  title,
  content,
  isPreviewMode,
  saveStatus,
  lastSaved,
  versionNumber,
  hasUnsavedChanges,
  onTitleChange,
  onContentChange,
  onTogglePreview,
  onSave,
  onVersionHistoryClick,
}: DocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
        return <span className="text-yellow-500">Unsaved changes</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex-grow">
          <Input
            className="text-xl font-semibold"
            placeholder="Document Title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePreview}
          className="flex items-center gap-1 h-9 rounded-md"
          aria-label={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
        >
          {isPreviewMode ? (
            <>
              <FileEdit className="h-4 w-4" />
              <span>Edit</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </>
          )}
        </Button>
      </div>
      
      {isPreviewMode ? (
        <div className="flex-grow overflow-auto bg-card p-4 rounded-md border">
          <MarkdownRenderer content={content} />
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          className="flex-grow min-h-[200px] font-mono resize-none transition-all focus:shadow-md"
          placeholder="Document content..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
        />
      )}
      
      <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center h-8">
        <span>
          {countWords(content)} words, {content.length} characters
        </span>
        <div className="flex items-center space-x-2">
          {versionNumber !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={onVersionHistoryClick}
            >
              <History className="mr-1 h-3.5 w-3.5" />
              <span>v{versionNumber}</span>
            </Button>
          )}
          {renderSaveStatus()}
          {(['unsaved', 'error'] as SaveStatus[]).includes(saveStatus) && (
            <Button 
              size="sm" 
              onClick={onSave}
              disabled={saveStatus === 'saving' || !hasUnsavedChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 