import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Message as MessageModel } from '@innerflame/types';
import { MessageItem } from './MessageItem.js';
import { Spinner } from '@/components/Spinner.js';
import { DocumentEditTagState } from '../../utils/documentEditUtils.js';

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
  shouldScrollToBottom?: boolean; // New prop to explicitly control scrolling
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
  shouldScrollToBottom = false // Default to false
}, ref) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [lastMessagePadding, setLastMessagePadding] = useState(0);
  const isResizingRef = useRef<boolean>(false);
  const paddingUpdateTimeoutRef = useRef<number | null>(null);
  const prevInitialLoadingRef = useRef<boolean>(true);

  // Component mount/update logging
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (paddingUpdateTimeoutRef.current) {
        clearTimeout(paddingUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Dynamic padding calculation that won't cause flashing
  const updateLastMessagePadding = useCallback(() => {
    if (!lastMessageRef.current || !containerRef.current || isInitialLoading) return;
    
    // Delay padding calculation to avoid frequent layout shifts
    if (paddingUpdateTimeoutRef.current) {
      clearTimeout(paddingUpdateTimeoutRef.current);
    }

    paddingUpdateTimeoutRef.current = window.setTimeout(() => {
      if (!lastMessageRef.current || !containerRef.current) return;
      
      // Use requestAnimationFrame to ensure we calculate after layout
      requestAnimationFrame(() => {
        if (!lastMessageRef.current || !containerRef.current) return;
        
        const viewportHeight = containerRef.current.clientHeight || 0;
        const lastMessageHeight = lastMessageRef.current.clientHeight || 0;
        
        // Only add padding if the message is shorter than the viewport
        const requiredPadding = Math.max(0, viewportHeight - lastMessageHeight);
        
        if (requiredPadding !== lastMessagePadding) {
          setLastMessagePadding(requiredPadding);
        }
        
        paddingUpdateTimeoutRef.current = null;
      });
    }, 100); // Delay to batch potential multiple updates
  }, [isInitialLoading, lastMessagePadding]);

  // Expose scrollToBottom function via ref
  const scrollToBottom = useCallback(() => {
    // Skip scrolling if we're currently resizing the window
    if (isResizingRef.current) return;
    
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

  // Calculate padding on initial load and when messages change
  useEffect(() => {
    if (!isInitialLoading && messages.length > 0) {
      updateLastMessagePadding();
    }
  }, [messages, isInitialLoading, updateLastMessagePadding]);
  
  // Handle window resize events to adjust padding
  useEffect(() => {
    const handleResize = () => {
      isResizingRef.current = true;
      updateLastMessagePadding();
      // Reset resizing flag after resize events have settled
      setTimeout(() => {
        isResizingRef.current = false;
      }, 200);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateLastMessagePadding]);

  // Handle initial loading completion
  useEffect(() => {
    // Check if initial loading just completed
    const initialLoadingJustCompleted = prevInitialLoadingRef.current && !isInitialLoading;
    
    // In desktop view, always scroll on initial load
    // In mobile view, only scroll if explicitly allowed via shouldScrollToBottom
    if (initialLoadingJustCompleted && messages.length > 0) {
      if (shouldScrollToBottom === false) {
        // Don't scroll when explicitly prevented (mobile non-active tab)
      } else {
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
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isFirstMessage = index === 0;
        
        return (
          <div 
            key={message.id}
            style={isLastMessage ? { marginBottom: `${lastMessagePadding}px` } : {}}
            className={`w-full px-2 ${!isLastMessage ? 'mb-1.5' : ''} ${isFirstMessage ? 'pt-[30px]' : ''}`}
          >
            {isLastMessage ? (
              <div ref={lastMessageRef}>
                <MessageItem
                  message={message}
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
                />
              </div>
            ) : (
              <MessageItem
                message={message}
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
              />
            )}
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
  );
}); 