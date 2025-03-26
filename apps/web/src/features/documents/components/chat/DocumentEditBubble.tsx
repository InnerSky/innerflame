import React from 'react';
import { DocumentEditTagState } from '../../utils/documentEditUtils.js';
import { LoadingDots } from '@/components/ui/loading-dots.js';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { Pencil, FileText, Check, Replace } from 'lucide-react';

// Helper functions for diff rendering
function isDiffContent(content: string): boolean {
  return content.includes('<<<<<<< SEARCH') && 
         content.includes('=======') && 
         content.includes('>>>>>>> REPLACE');
}

function parseDiffBlocks(content: string): { search: string; replace: string }[] {
  const diffBlocks: { search: string; replace: string }[] = [];
  const regex = /<<<<<<< SEARCH\s*([\s\S]*?)=======\s*([\s\S]*?)>>>>>>> REPLACE/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.length >= 3) {
      diffBlocks.push({
        search: match[1],
        replace: match[2]
      });
    }
  }
  
  return diffBlocks;
}

function renderDiffContent(content: string): React.ReactNode {
  if (!isDiffContent(content)) {
    return <MarkdownRenderer content={content} />;
  }

  const diffBlocks = parseDiffBlocks(content);
  
  return (
    <div className="space-y-4">
      {diffBlocks.map((block, index) => (
        <div key={index} className="text-sm">
          <div className="mb-2 line-through text-red-600 font-mono whitespace-pre-wrap bg-red-50 px-3 py-1.5 rounded">
            {block.search}
          </div>
          <div className="text-green-600 font-mono whitespace-pre-wrap bg-green-50 px-3 py-1.5 rounded">
            {block.replace}
          </div>
        </div>
      ))}
    </div>
  );
}

interface DocumentEditBubbleProps {
  content: string;
  state: DocumentEditTagState;
  className?: string;
  tagType?: 'document_edit' | 'write_to_file' | 'replace_in_file';
}

export const DocumentEditBubble: React.FC<DocumentEditBubbleProps> = ({
  content,
  state,
  className = '',
  tagType = 'document_edit'
}) => {
  // Only render content if we're in CONTENT_STARTED or COMPLETED state
  const hasContent = state === DocumentEditTagState.CONTENT_STARTED || 
                    state === DocumentEditTagState.COMPLETED;
  
  // Determine if this is a diff/replace operation
  const isReplaceOperation = tagType === 'replace_in_file' || isDiffContent(content);
  
  return (
    <div 
      className={`
        border-l-2 border-primary/40 pl-3 py-2
        text-sm relative
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 text-xs text-primary/80">
        <div className="flex items-center">
          {state === DocumentEditTagState.WAITING && <Pencil className="h-3.5 w-3.5" />}
          {(state === DocumentEditTagState.CONTENT_STARTED || state === DocumentEditTagState.COMPLETED) && 
            isReplaceOperation ? <Replace className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
        </div>
        <div className="font-medium">
          {isReplaceOperation ? 'Text changes' : 'Document edit'}
          {state === DocumentEditTagState.COMPLETED && (
            <span className="ml-2 text-green-600">
              <Check className="h-3 w-3 inline mr-0.5" />
              Done
            </span>
          )}
        </div>
      </div>
      
      {/* Content section */}
      <div>
        {!hasContent && (
          <div className="flex items-center gap-2 text-muted-foreground py-1">
            <LoadingDots />
            <span className="text-xs">Processing...</span>
          </div>
        )}
        
        {hasContent && content && (
          <div className="document-edit-content">
            {isReplaceOperation ? renderDiffContent(content) : <MarkdownRenderer content={content} />}
          </div>
        )}
      </div>
    </div>
  );
}; 