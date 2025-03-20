import React, { useRef, useEffect, useState, MutableRefObject, useLayoutEffect } from 'react';
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
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Use an object with a mutable current property for storing message element references
  const messageRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
  const [lastMessagePadding, setLastMessagePadding] = useState(0);
  const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const prevStreamingStateRef = useRef<Record<string, boolean>>({});
  const isFirstRenderRef = useRef<boolean>(true);
  const isManuallyScrolledRef = useRef<boolean>(false);
  const scrollPositionRef = useRef<number>(0);
  
  // Advanced streaming state tracking
  const streamingIdsRef = useRef<Set<string>>(new Set());
  
  // Track scroll position manually to prevent browser auto-scrolling
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    const handleScroll = () => {
      // If user has manually scrolled, remember this
      isManuallyScrolledRef.current = true;
      // Store current scroll position
      scrollPositionRef.current = container.scrollTop;
    };
    
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Initialize the tracking refs on first render only
  useLayoutEffect(() => {
    if (isFirstRenderRef.current) {
      prevMessagesLengthRef.current = messages.length;
      prevStreamingStateRef.current = { ...streamingMessages };
      streamingIdsRef.current = new Set(Object.keys(streamingMessages));
      isFirstRenderRef.current = false;
    }
  }, [messages.length, streamingMessages]);
  
  // Track the last user message
  useEffect(() => {
    if (messages.length > 0) {
      // Find the last user message
      for (let i = messages.length - 1; i >= 0; i--) {
        if (String(messages[i].sender_type) === 'user') {
          setLastUserMessageId(messages[i].id);
          break;
        }
      }
    }
  }, [messages]);
  
  // Detect streaming state changes - specifically track when streaming ENDS
  useEffect(() => {
    if (isFirstRenderRef.current) return;
    
    // Get current streaming IDs
    const currentStreamingIds = new Set(Object.keys(streamingMessages));
    
    // Check for IDs that were streaming before but aren't now (streaming ended)
    const streamingEnded = Array.from(streamingIdsRef.current).some(id => !currentStreamingIds.has(id));
    
    if (streamingEnded && isManuallyScrolledRef.current && containerRef.current) {
      // If streaming ended AND user manually scrolled at some point,
      // preserve the scroll position to prevent unwanted scrolling
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
    
    // Update our tracking ref with current streaming IDs
    streamingIdsRef.current = currentStreamingIds;
  }, [streamingMessages]);
  
  // Adjust padding for the last message to allow it to scroll to the top
  // Preserve scroll position when recalculating to prevent unwanted scrolling
  useEffect(() => {
    if (!isInitialLoading && messages.length > 0 && lastMessageRef.current && containerRef.current) {
      const adjustPadding = () => {
        // Save current scroll position before adjusting padding
        const scrollTop = containerRef.current?.scrollTop || 0;
        
        const viewportHeight = containerRef.current?.clientHeight || 0;
        const lastMessageHeight = lastMessageRef.current?.clientHeight || 0;
        
        // Calculate required padding (viewport height - message height)
        // Only add padding if the message is shorter than the viewport
        const requiredPadding = Math.max(0, viewportHeight - lastMessageHeight);
        
        // Only update if padding actually changed, to minimize layout shifts
        if (requiredPadding !== lastMessagePadding) {
          setLastMessagePadding(requiredPadding);
          
          // Restore scroll position after padding change
          requestAnimationFrame(() => {
            if (containerRef.current && isManuallyScrolledRef.current) {
              containerRef.current.scrollTop = scrollTop;
            }
          });
        }
      };
      
      // Initial calculation
      adjustPadding();
      
      // Recalculate when window is resized
      window.addEventListener('resize', adjustPadding);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', adjustPadding);
      };
    }
  }, [messages, isInitialLoading, lastMessagePadding]);
  
  // Smart scroll handling - ONLY triggers actual scrolling in specific cases
  useEffect(() => {
    if (isInitialLoading || messages.length === 0 || isFirstRenderRef.current) return;
    
    // Check if new messages were added
    const messagesAdded = messages.length > prevMessagesLengthRef.current;
    
    // Check if streaming just started (new ID appeared in streaming map)
    let streamingStarted = false;
    for (const id in streamingMessages) {
      if (streamingMessages[id] && !prevStreamingStateRef.current[id]) {
        streamingStarted = true;
        break;
      }
    }
    
    // Capture the conditions that will trigger scrolling before we do any updates
    const shouldScroll = messagesAdded || streamingStarted;
    
    if (shouldScroll) {
      // When we deliberately scroll, reset the manual scroll flag
      isManuallyScrolledRef.current = false;
      
      // Small delay to ensure DOM is updated before scrolling
      const scrollTimer = setTimeout(() => {
        // Check if the last message is streaming and from assistant
        const lastMessage = messages[messages.length - 1];
        const isLastMessageStreaming = lastMessage.id in streamingMessages;
        const isLastMessageFromAssistant = String(lastMessage.sender_type) !== 'user';
        
        if (isLastMessageStreaming && isLastMessageFromAssistant && lastUserMessageId) {
          // If the last message is a streaming assistant message, scroll to position the last user message at the top
          const userMessageElement = messageRefsMap.current[lastUserMessageId];
          if (userMessageElement) {
            userMessageElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
          } else {
            // Fallback to default scrolling
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        } else if (messagesAdded) {
          // Only scroll to end for new messages, not for streaming status changes
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      return () => clearTimeout(scrollTimer);
    }
    
    // Critical fix: Only update our tracking refs when we should
    // This ensures we maintain correct "previous state" references for comparison
    if (shouldScroll || messagesAdded) {
      prevMessagesLengthRef.current = messages.length;
    }
    
    if (shouldScroll || Object.keys(streamingMessages).length !== Object.keys(prevStreamingStateRef.current).length) {
      prevStreamingStateRef.current = { ...streamingMessages };
    }
  }, [messages, isInitialLoading, streamingMessages, lastUserMessageId]);
  
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
        return (
          <div 
            key={message.id}
            ref={el => {
              // Store message element references
              messageRefsMap.current[message.id] = el;
            }}
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