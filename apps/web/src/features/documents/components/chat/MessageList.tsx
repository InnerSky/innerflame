import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Message as MessageModel } from '@innerflame/types';
import { MessageItem } from './MessageItem.js';
import { Spinner } from '@/components/Spinner.js';
import { DocumentEditTagState } from '../../utils/documentEditUtils.js';
import { ChatInterfaceRef } from '../ChatInterface.js';

interface MessageListProps {
  messages: MessageModel[];
  streamingContents: Record<string, string>;
  streamingMessages: Record<string, boolean>;
  documentEditStates?: Record<string, DocumentEditTagState>;
  editingMessageId: string | null;
  isEditing: boolean;
  editedMessageIds: Set<string>;
  isInitialLoading: boolean;
  isLoading: boolean;
  isMobileScreen: boolean;
  isStandalone: boolean;
  onEdit: (messageId: string, content: string) => Promise<boolean | undefined>;
  onDelete: (messageId: string) => Promise<boolean | undefined>;
  onCancelEdit: () => void;
  onStartEdit: (messageId: string) => void;
  shouldScrollToBottom?: boolean; // Prop to explicitly control scrolling
  chatInterfaceRef?: React.RefObject<ChatInterfaceRef>;
}

// Export MessageList as a forwardRef component
export const MessageList = forwardRef<{ scrollToBottom: () => void }, MessageListProps>(({
  messages,
  streamingContents,
  streamingMessages,
  documentEditStates = {}, // Default to empty object
  editingMessageId,
  isEditing,
  editedMessageIds,
  isInitialLoading,
  isLoading,
  isMobileScreen,
  isStandalone,
  onEdit,
  onDelete,
  onCancelEdit,
  onStartEdit,
  shouldScrollToBottom = false, // Default to false
  chatInterfaceRef
}, ref) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevInitialLoadingRef = useRef<boolean>(true);

  // Scroll to bottom function (simplified)
  const scrollToBottom = useCallback(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToBottom
  }));

  // Handle initial loading completion
  useEffect(() => {
    // Check if initial loading just completed
    const initialLoadingJustCompleted = prevInitialLoadingRef.current && !isInitialLoading;
    
    if (initialLoadingJustCompleted && messages.length > 0) {
      if (shouldScrollToBottom !== false) {
        scrollToBottom();
      }
    }
    
    // Update ref for next comparison
    prevInitialLoadingRef.current = isInitialLoading;
  }, [isInitialLoading, messages.length, scrollToBottom, shouldScrollToBottom]);

  // Explicitly controlled scrolling
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
    }
  }, [shouldScrollToBottom, scrollToBottom]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="md" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-center p-4">
        Ask questions about your document or get help with your content.
      </p>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden w-full" ref={containerRef}>
      <div className="px-2 pt-4 pb-[150px] space-y-4 md:space-y-6">
        {messages.map((message, index) => {
          const isFirstMessage = index === 0;
          
          return (
            <div 
              key={message.id}
              className={`w-full px-2 mb-1.5 ${isFirstMessage ? 'pt-[30px]' : ''}`}
            >
              <MessageItem
                message={message}
                messages={messages}
                messageIndex={index}
                isStreaming={message.id in streamingMessages}
                streamingContent={streamingContents[message.id]}
                documentEditState={documentEditStates[message.id]}
                isEditing={editingMessageId === message.id}
                isEditingLoading={isEditing}
                isEdited={message.isEdited || editedMessageIds.has(message.id)}
                isMobileScreen={isMobileScreen}
                isStandalone={isStandalone}
                onEdit={onEdit}
                onDelete={onDelete}
                onCancelEdit={onCancelEdit}
                onStartEdit={onStartEdit}
                chatInterfaceRef={chatInterfaceRef}
              />
            </div>
          );
        })}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
        
        {isLoading && !isInitialLoading && (
          <div className="flex items-center justify-center p-2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}); 