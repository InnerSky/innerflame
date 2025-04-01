import React from 'react';
import { DocumentEditTagState } from '../../utils/documentEditUtils.js';
import { LoadingDots } from '@/components/ui/loading-dots.js';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { Pencil, FileText, Replace } from 'lucide-react';

// Helper functions for diff rendering
function isDiffContent(content: string): boolean {
  return content.includes('<<<<<<< SEARCH') && 
         content.includes('=======') && 
         content.includes('>>>>>>> REPLACE');
}

// Helper function to find common prefix length between two strings
function findCommonPrefixLength(str1: string, str2: string): number {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return i;
}

// Helper function to find common suffix length between two strings
function findCommonSuffixLength(str1: string, str2: string, prefixLength: number): number {
  let i = 0;
  while (
    i < (str1.length - prefixLength) && 
    i < (str2.length - prefixLength) && 
    str1[str1.length - 1 - i] === str2[str2.length - 1 - i]
  ) {
    i++;
  }
  return i;
}

interface DiffBlock {
  prefix: string;
  searchDiff: string;
  replaceDiff: string;
  suffix: string;
}

function processSearchReplace(search: string, replace: string): DiffBlock {
  // Find common prefix
  const prefixLength = findCommonPrefixLength(search, replace);
  
  // Find common suffix, starting after the prefix
  const suffixLength = findCommonSuffixLength(
    search.slice(prefixLength), 
    replace.slice(prefixLength),
    prefixLength
  );
  
  return {
    prefix: search.slice(0, prefixLength),
    searchDiff: search.slice(prefixLength, search.length - suffixLength),
    replaceDiff: replace.slice(prefixLength, replace.length - suffixLength),
    suffix: search.slice(search.length - suffixLength)
  };
}

function parseDiffBlocks(content: string): DiffBlock[] {
  const diffBlocks: DiffBlock[] = [];
  const regex = /<<<<<<< SEARCH\s*([\s\S]*?)=======\s*([\s\S]*?)>>>>>>> REPLACE/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.length >= 3) {
      const search = match[1].trim();
      const replace = match[2].trim();
      diffBlocks.push(processSearchReplace(search, replace));
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
        <div key={index} className="text-sm font-mono">
          {/* Show prefix if it exists and is not just whitespace */}
          {block.prefix.trim() && (
            <div className="text-muted-foreground dark:text-muted-foreground/60 whitespace-pre-wrap mb-1">
              {block.prefix}
            </div>
          )}
          
          {/* Show the actual diff */}
          <div className="flex flex-col gap-1">
            <div className="line-through text-red-600 dark:text-red-300/90 whitespace-pre-wrap bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded">
              {block.searchDiff}
            </div>
            <div className="text-green-600 dark:text-emerald-300/90 whitespace-pre-wrap bg-green-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded">
              {block.replaceDiff}
            </div>
          </div>
          
          {/* Show suffix if it exists and is not just whitespace */}
          {block.suffix.trim() && (
            <div className="text-muted-foreground dark:text-muted-foreground/60 whitespace-pre-wrap mt-1">
              {block.suffix}
            </div>
          )}
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
        border-l-2 border-primary/40 dark:border-primary/20 pl-3 py-2
        text-sm relative
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 text-xs text-primary/80 dark:text-primary/60">
        <div className="flex items-center">
          {state === DocumentEditTagState.WAITING && <Pencil className="h-3.5 w-3.5" />}
          {(state === DocumentEditTagState.CONTENT_STARTED || state === DocumentEditTagState.COMPLETED) && 
            isReplaceOperation ? <Replace className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
        </div>
        <div className="font-medium">
          {isReplaceOperation ? 'Text changes' : 'Document edit'}
        </div>
      </div>
      
      {/* Content section */}
      <div>
        {!hasContent && (
          <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground/60 py-1">
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