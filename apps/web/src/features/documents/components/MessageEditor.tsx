import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@innerflame/types';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Check, X } from 'lucide-react';

interface MessageEditorProps {
  message: Message;
  onSave: (newContent: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const MessageEditor: React.FC<MessageEditorProps> = ({
  message,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [editedContent, setEditedContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus textarea on mount
  useEffect(() => {
    // Add a slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Place cursor at the end
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSave = async () => {
    if (editedContent.trim() === '') return;
    await onSave(editedContent);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Cancel on Escape
    else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };
  
  const hasChanges = editedContent.trim() !== message.content.trim();
  
  return (
    <div className="flex flex-col gap-2 z-10 relative w-full">
      <Textarea
        ref={textareaRef}
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[100px] max-h-[240px] resize-none font-inherit p-2 text-sm w-full overflow-y-auto"
        style={{
          height: 'auto',
          overflowY: editedContent.split('\n').length > 10 ? 'scroll' : 'hidden'
        }}
        rows={Math.min(editedContent.split('\n').length || 1, 10)}
        placeholder="Edit your message..."
        disabled={isLoading}
        aria-label="Edit message"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cancel editing"
        >
          <X className="h-4 w-4 mr-1" />
          <span>Cancel</span>
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          aria-label="Save changes"
        >
          {isLoading ? (
            <span className="h-4 w-4 mr-1 rounded-full border-2 border-t-transparent border-current animate-spin"></span>
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          <span>Save</span>
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        <span>Tip: Press Ctrl+Enter to save, Escape to cancel</span>
      </div>
    </div>
  );
}; 