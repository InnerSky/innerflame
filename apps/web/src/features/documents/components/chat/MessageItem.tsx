import React from 'react';
import { Message as MessageModel } from '../../models/message.js';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { MessageActions } from '../MessageActions.js';
import { MessageEditor } from '../MessageEditor.js';

interface MessageItemProps {
  message: MessageModel;
  isStreaming: boolean;
  streamingContent?: string;
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
  
  // Handle save edit
  const handleSaveEdit = async (newContent: string) => {
    await onEdit(message.id, newContent);
  };
  
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
          {/* For streaming messages */}
          {isStreaming ? (
            <MarkdownRenderer 
              content={streamingContent || "Generating response..."} 
              className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
            />
          ) : (
            <MarkdownRenderer 
              content={message.content} 
              className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
            />
          )}
        </>
      )}
    </div>
  );
}; 