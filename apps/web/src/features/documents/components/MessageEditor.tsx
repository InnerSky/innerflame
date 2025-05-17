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
        
        // Auto-resize textarea to fit content without scrollbars
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Auto-resize textarea whenever content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editedContent]);
  
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
        className="resize-none font-inherit p-2 text-sm w-full border-none overflow-visible"
        style={{
          minHeight: '100px',
          height: 'auto',
          maxHeight: 'none',
          overflow: 'visible'
        }}
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
    </div>
  );
}; 