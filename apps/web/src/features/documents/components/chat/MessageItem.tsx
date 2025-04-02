import React, { useEffect, useMemo, useCallback } from 'react';
import { Message as MessageModel } from '@innerflame/types';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { MessageActions } from '../MessageActions.js';
import { MessageEditor } from '../MessageEditor.js';
import { LoadingDots } from '@/components/ui/loading-dots.js';
import { DocumentEditBubble } from './DocumentEditBubble.js';
import { 
  containsDocumentEditTags, 
  parseDocumentEdit, 
  DocumentEditTagState,
  createSafeDisplayText,
  parseMessageSegments,
  parseStreamingSegments,
  SegmentType
} from '../../utils/documentEditUtils.js';

interface MessageItemProps {
  message: MessageModel;
  isStreaming: boolean;
  streamingContent?: string;
  documentEditState?: DocumentEditTagState;
  isEditing: boolean;
  isEditingLoading: boolean;
  isEdited: boolean;
  isMobileScreen: boolean;
  isStandalone: boolean;
  onEdit: (messageId: string, content: string) => Promise<boolean | undefined>;
  onDelete: (messageId: string) => Promise<boolean | undefined>;
  onCancelEdit: () => void;
  onStartEdit: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming,
  streamingContent,
  documentEditState: propDocumentEditState,
  isEditing,
  isEditingLoading,
  isEdited,
  isMobileScreen,
  isStandalone,
  onEdit,
  onDelete,
  onCancelEdit,
  onStartEdit
}) => {
  const isUserMessage = String(message.sender_type) === 'user';
  
  // Parse message into segments
  const messageSegments = useMemo(() => {
    // For user messages, don't segment
    if (isUserMessage) {
      return [{
        type: SegmentType.TEXT,
        content: message.content
      }];
    }
    
    // For streaming assistant messages
    if (isStreaming && streamingContent) {
      return parseStreamingSegments(streamingContent);
    }
    
    // For completed assistant messages
    if (message.content) {
      return parseMessageSegments(message.content);
    }
    
    return [];
  }, [isUserMessage, isStreaming, streamingContent, message.content]);
  
  // Memoize the renderSegment function to prevent recreating it on each render
  const renderSegment = useCallback((segment: any, index: number) => {
    if (segment.type === SegmentType.TEXT) {
      return (
        <div key={`segment-${index}`} className="mb-3 last:mb-0">
          <MarkdownRenderer 
            content={segment.content} 
            className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
          />
        </div>
      );
    } else if (segment.type === SegmentType.DOCUMENT_EDIT) {
      // Use state from prop if available, otherwise use the segment's state
      const editState = propDocumentEditState !== undefined 
        ? propDocumentEditState 
        : segment.editState || DocumentEditTagState.NONE;
      
      return (
        <div key={`segment-${index}`} className="mb-3 last:mb-0">
          <DocumentEditBubble 
            content={segment.content} 
            state={editState} 
          />
        </div>
      );
    }
    return null;
  }, [propDocumentEditState]); // Only recreate when propDocumentEditState changes
  
  // Handle save edit
  const handleSaveEdit = async (newContent: string) => {
    await onEdit(message.id, newContent);
  };

  // Add debugging useEffect to track component lifecycle
  useEffect(() => {
    // Component mounted
    return () => {
      // Component will unmount
    };
  }, [message.id]);

  return (
    <div
      className={`p-3 rounded-lg relative group ${
        isUserMessage
          ? 'bg-primary/10 ml-8 mr-0 pl-2'
          : 'bg-secondary/20 mr-8 ml-0 pr-2'
      }`}
    >
      {/* User messages with edit capability */}
      {isUserMessage && message.id !== `temp-${Date.now()}` && (
        <>
          {isEditing ? (
            /* Edit mode */
            <MessageEditor
              message={message}
              onSave={handleSaveEdit}
              onCancel={onCancelEdit}
              isLoading={isEditingLoading}
            />
          ) : (
            /* Display mode with actions */
            <>
              <MessageActions
                message={message}
                onEdit={onStartEdit}
                onDelete={onDelete}
                isMobile={!isStandalone && isMobileScreen}
                position="left"
              />
              <MarkdownRenderer 
                content={message.content} 
                className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
              />
              {isEdited && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span>(edited)</span>
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* Assistant messages (never editable) */}
      {!isUserMessage && (
        <>
          <MessageActions
            message={message}
            onEdit={onStartEdit}
            onDelete={onDelete}
            isMobile={!isStandalone && isMobileScreen}
            canEdit={false}
            position="right"
          />
          
          {/* Display segmented content */}
          {messageSegments.length > 0 ? (
            <div className="assistant-message-segments">
              {messageSegments.map(renderSegment)}
            </div>
          ) : (
            /* Fallback for when we have no segments */
            isStreaming ? (
              streamingContent ? (
                <MarkdownRenderer 
                  content={createSafeDisplayText(streamingContent)} 
                  className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                />
              ) : (
                <LoadingDots />
              )
            ) : (
              <MarkdownRenderer 
                content={message.content} 
                className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
              />
            )
          )}
        </>
      )}
    </div>
  );
}; 