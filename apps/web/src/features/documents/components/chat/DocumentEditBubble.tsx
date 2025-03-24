import React from 'react';
import { DocumentEditTagState } from '../../utils/documentEditUtils.js';
import { LoadingDots } from '@/components/ui/loading-dots.js';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { Pencil, FileText, Check } from 'lucide-react';

interface DocumentEditBubbleProps {
  content: string;
  state: DocumentEditTagState;
  className?: string;
}

export const DocumentEditBubble: React.FC<DocumentEditBubbleProps> = ({
  content,
  state,
  className = ''
}) => {
  // Only render content if we're in CONTENT_STARTED or COMPLETED state
  const hasContent = state === DocumentEditTagState.CONTENT_STARTED || 
                    state === DocumentEditTagState.COMPLETED;
  
  return (
    <div 
      className={`
        border border-primary/30 rounded-lg p-4 
        bg-primary/5 text-sm relative
        ${className}
      `}
    >
      {/* Header with icon and status */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/20">
        <div className="flex items-center text-primary">
          {state === DocumentEditTagState.WAITING && <Pencil className="h-4 w-4" />}
          {(state === DocumentEditTagState.CONTENT_STARTED || state === DocumentEditTagState.COMPLETED) && 
            <FileText className="h-4 w-4" />}
        </div>
        <div className="text-xs font-medium text-primary/80">
          Document Edit
          {state === DocumentEditTagState.COMPLETED && (
            <span className="ml-2 inline-flex items-center text-green-600">
              <Check className="h-3 w-3 mr-1" />
              Complete
            </span>
          )}
        </div>
      </div>
      
      {/* Content section */}
      <div className="text-sm">
        {!hasContent && (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <LoadingDots />
            <span>Preparing document edit...</span>
          </div>
        )}
        
        {hasContent && content && (
          <div className="document-edit-content">
            <MarkdownRenderer content={content} />
          </div>
        )}
      </div>
      
      {/* Footer with controls (could add approve/reject buttons here later) */}
      {state === DocumentEditTagState.COMPLETED && (
        <div className="mt-2 pt-2 border-t border-primary/20 text-xs text-muted-foreground">
          Document edit completed. You can copy this content or continue the conversation.
        </div>
      )}
    </div>
  );
}; 