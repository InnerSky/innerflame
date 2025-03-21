import React, { useRef, useEffect, useState } from 'react';
import { Message as MessageModel } from '../../models/message.js';
import { MessageItem } from './MessageItem.js';
import { Spinner } from '@/components/Spinner.js';

interface MessageListProps {
  messages: MessageModel[];
  streamingContents: Record<string, string>;
  streamingMessages: Record<string, boolean>;
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
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingContents,
  streamingMessages,
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
  onStartEdit
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const secondLastMessageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [lastMessagePadding, setLastMessagePadding] = useState(0);
  const prevMessagesLengthRef = useRef<number>(0);
  const prevInitialLoadingRef = useRef<boolean>(true);

  // Adjust padding for the last message (keeping this for UI appearance)
  useEffect(() => {
    if (!isInitialLoading && messages.length > 0 && lastMessageRef.current && containerRef.current) {
      const viewportHeight = containerRef.current.clientHeight || 0;
      const lastMessageHeight = lastMessageRef.current.clientHeight || 0;
      
      // Only add padding if the message is shorter than the viewport
      const requiredPadding = Math.max(0, viewportHeight - lastMessageHeight);
      
      if (requiredPadding !== lastMessagePadding) {
        setLastMessagePadding(requiredPadding);
      }
    }
  }, [messages, isInitialLoading, lastMessagePadding]);

  // Unified scrolling logic for all scenarios
  useEffect(() => {
    // Skip if we're still loading or have no messages
    if (messages.length === 0) return;
    
    // Determine what triggered this effect
    const initialLoadingJustCompleted = prevInitialLoadingRef.current && !isInitialLoading;
    const messagesAdded = messages.length > prevMessagesLengthRef.current;
    
    // Check if the last message is from the user
    let isLastAddedMessageFromUser = false;
    if (messagesAdded && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      isLastAddedMessageFromUser = String(lastMessage.sender_type) === 'user';
    }
    
    // Scroll only when:
    // 1. Initial loading just completed (first load)
    // 2. User adds a new message
    const shouldScroll = 
      (initialLoadingJustCompleted && !isInitialLoading && messages.length > 0) || 
      (messagesAdded && isLastAddedMessageFromUser);
    
    if (shouldScroll) {
      // Use a timeout to ensure DOM is updated
      const timer = setTimeout(() => {
        // Scroll to the second last message instead of the bottom
        if (messages.length > 1 && secondLastMessageRef.current) {
          secondLastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (messagesEndRef.current) {
          // Fallback to scrolling to the bottom if there's only one message
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Update refs for next comparison
    prevInitialLoadingRef.current = isInitialLoading;
    if (!isInitialLoading) {
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages, isInitialLoading]);

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
        const isSecondLastMessage = index === messages.length - 2;
        
        return (
          <div 
            key={message.id}
            ref={isSecondLastMessage ? secondLastMessageRef : undefined}
            style={isLastMessage ? { marginBottom: `${lastMessagePadding}px` } : {}}
            className="w-full"
          >
            {isLastMessage ? (
              <div ref={lastMessageRef}>
                <MessageItem
                  message={message}
                  isStreaming={message.id in streamingMessages}
                  streamingContent={streamingContents[message.id]}
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
}; 