import React, { useState, useEffect, KeyboardEvent, useRef, useCallback } from 'react';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Send, MessageSquare } from 'lucide-react';
import { Spinner } from '@/components/Spinner.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { MessageService } from '../services/messageService.js';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { 
  Message as MessageModel, 
  MessageSenderType, 
  MessageContextType,
  determineMessageContext 
} from '../models/message.js';
import { useAuth } from '@/hooks/useAuth.ts';
import { MessageActions } from './MessageActions.js';
import { MessageEditor } from './MessageEditor.js';
import { useToast } from '@/hooks/use-toast.ts';
import { createAIStream } from '../services/sseClient.js';

type ChatInterfaceProps = {
  className?: string;
  isStandalone?: boolean;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Check if addEventListener is available (browser environment)
    if (typeof window !== 'undefined') {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [query]);
  
  return matches;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className = '',
  isStandalone = false
}) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<MessageModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextSwitchRef = useRef(false);
  const prevContextRef = useRef<{contextType?: MessageContextType, contextId?: string | null}>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<Record<string, boolean>>({});
  const [streamingContents, setStreamingContents] = useState<Record<string, string>>({});
  const streamCloseRef = useRef<(() => void) | null>(null);
  
  // Get auth data
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get document context
  const { 
    selectedDocument, 
    title, 
    content, 
    selectedProjectId,
    projectsData
  } = useDocumentsContext();
  
  // Determine the current context type
  const { contextType, contextId } = determineMessageContext(
    selectedDocument, 
    selectedProjectId
  );

  // Add media query for mobile detection
  const isMobileScreen = useMediaQuery('(max-width: 768px)');
  
  // Detect context changes
  useEffect(() => {
    if (prevContextRef.current.contextType !== contextType ||
        prevContextRef.current.contextId !== contextId) {
      // Context has changed
      contextSwitchRef.current = true;
      
      // Update previous context
      prevContextRef.current = { contextType, contextId };
      
      // Reset the flag after a delay to account for all rendering and animations
      const timer = setTimeout(() => {
        contextSwitchRef.current = false;
      }, 1000); // 1 second should cover all animations
      
      return () => clearTimeout(timer);
    }
  }, [contextType, contextId]);
  
  // Actual document and project names for display
  const documentName = selectedDocument?.title || 'No document';
  const projectName = selectedProjectId ? 
    (projectsData[selectedProjectId] || 'Unknown project') : 
    'All Documents';
  
  const isProjectOnlyMode = contextType === MessageContextType.Project;
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message only on Ctrl+Enter or Shift+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault(); // Prevent new line
      sendMessage();
    }
    // Regular Enter should just add a new line (default textarea behavior)
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    // Skip scrolling when we're in the middle of a context switch
    if (contextSwitchRef.current) return;
    
    // Only perform smooth scrolling if we're not in the middle of a selection change
    const behavior = document.activeElement?.tagName === 'TEXTAREA' ? 'auto' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom when chat history changes, but add conditions to prevent
  // disruptive scrolling when switching between document/project views
  useEffect(() => {
    // Don't auto-scroll during initial loading or context switches
    if (!isInitialLoading && !contextSwitchRef.current) {
      // Small delay to ensure DOM is updated before scrolling
      const scrollTimer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [chatHistory, isInitialLoading]);
  
  // Load messages when context changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
      
      setIsInitialLoading(true);
      
      try {
        let messages: MessageModel[] = [];
        
        if (contextId) {
          if (contextType === MessageContextType.Document) {
            messages = await MessageService.getDocumentMessages(contextId);
          } else if (contextType === MessageContextType.Project) {
            messages = await MessageService.getProjectMessages(contextId);
          }
        } else {
          messages = await MessageService.getGeneralMessages();
        }
        
        // Sort messages by creation date - oldest first
        messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setChatHistory(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error loading messages",
          description: "Could not load the conversation history.",
          variant: "destructive"
        });
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedDocument, selectedProjectId, user, contextType, contextId, toast]);
  
  // Track which messages have been edited in this session
  const [editedMessageIds, setEditedMessageIds] = useState<Set<string>>(new Set());
  
  const sendMessage = async () => {
    if (!message.trim() || isLoading || !user) return;
    
    // Add user message to chat (optimistic update)
    const userMessage: MessageModel = {
      id: `temp-${Date.now()}`,
      content: message,
      user_id: user.id,
      sender_type: MessageSenderType.User,
      context_type: contextType,
      context_id: contextId,
      createdAt: new Date(),
      has_proposed_changes: false,
      display_thread_id: null,
      reply_to_message_id: null
    };
    
    // Append to history instead of prepending
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Save the message to the database
      const savedMessage = await MessageService.createMessage({
        content: message,
        userId: user.id,
        senderType: MessageSenderType.User,
        contextType,
        contextId: contextId || undefined
      });
      
      // Replace the temporary message with the saved one
      setChatHistory(prev => 
        prev.map(msg => msg.id === userMessage.id ? savedMessage : msg)
      );
      
      // Create a stable timestamp for the streaming message ID
      const streamingTimestamp = Date.now();
      const streamingId = `streaming-${streamingTimestamp}`;
      
      // Store the current streaming message ID for reference
      setCurrentStreamingId(streamingId);
      // Also mark this message as streaming in our map
      setStreamingMessages(prev => ({...prev, [streamingId]: true}));
      
      // Ensure isStreaming is set to true for every new streaming message
      setIsStreaming(true);
      console.log('Setting isStreaming to TRUE for new message:', streamingId);
      
      // Create a streaming message placeholder
      const streamingPlaceholder: MessageModel = {
        id: streamingId,
        content: '',
        user_id: user.id,
        sender_type: 'assistant',
        context_type: contextType === MessageContextType.Document 
          ? 'document' 
          : contextType === MessageContextType.Project
            ? 'project'
            : 'general',
        context_id: contextId,
        createdAt: new Date(),
        has_proposed_changes: false,
        display_thread_id: null,
        reply_to_message_id: null
      };
      
      // Add the streaming placeholder to chat history
      setChatHistory(prev => [...prev, streamingPlaceholder]);
      
      // Reset streaming state
      setStreamingMessage('');
      
      // Close any existing stream
      if (streamCloseRef.current) {
        streamCloseRef.current();
        streamCloseRef.current = null;
      }
      
      // Start streaming
      const { close } = createAIStream({
        message: savedMessage.content,
        userId: user.id,
        contextType: contextType === MessageContextType.Document 
          ? 'document' 
          : contextType === MessageContextType.Project
            ? 'project'
            : 'general',
        documentId: contextId && contextType === MessageContextType.Document ? contextId : undefined,
        documentTitle: selectedDocument?.title,
        documentContent: content,
        projectId: selectedProjectId || undefined,
        projectName: projectName,
        onConnectionChange: (connected) => {
          if (!connected) {
            setIsLoading(false);
            setIsStreaming(false);
          }
        },
        onChunk: (chunk) => {
          console.log('Received chunk:', chunk);
          // For the global streaming message state (will be deprecated)
          if (currentStreamingId === streamingId) {
            setStreamingMessage(prev => {
              const updated = prev + chunk;
              console.log('Updated streamingMessage state:', updated);
              return updated;
            });
          }
          
          // Also update the streaming content for this specific message ID
          setStreamingContents(prev => {
            const nextContents = {
              ...prev,
              [streamingId]: (prev[streamingId] || '') + chunk
            };
            console.log(`Updated streamingContents for ${streamingId}:`, nextContents[streamingId]);
            return nextContents;
          });
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          toast({
            title: "Error during streaming",
            description: error,
            variant: "destructive"
          });
          setIsLoading(false);
          
          // Only set isStreaming to false if there are no other active streaming messages
          const hasOtherStreamingMessages = Object.keys(streamingMessages).length > 1 || 
            (Object.keys(streamingMessages).length === 1 && !(streamingId in streamingMessages));
          
          if (!hasOtherStreamingMessages) {
            setIsStreaming(false);
            console.log('Setting isStreaming to FALSE, no more active streaming messages');
          } else {
            console.log('Keeping isStreaming as TRUE, other active messages exist:', 
              Object.keys(streamingMessages).filter(id => id !== streamingId));
          }
          
          setCurrentStreamingId(null);
          setStreamingMessages(prev => {
            const updated = {...prev};
            if (streamingId in updated) {
              delete updated[streamingId];
            }
            return updated;
          });
          
          // Clean up the content in streamingContents
          setStreamingContents(prev => {
            const updated = {...prev};
            if (streamingId in updated) {
              delete updated[streamingId];
            }
            return updated;
          });
        },
        onComplete: async (data) => {
          setIsLoading(false);
          // Only set isStreaming to false if there are no other active streaming messages
          const hasOtherStreamingMessages = Object.keys(streamingMessages).length > 1 || 
            (Object.keys(streamingMessages).length === 1 && !(streamingId in streamingMessages));
          
          if (!hasOtherStreamingMessages) {
            setIsStreaming(false);
            console.log('Setting isStreaming to FALSE, no more active streaming messages');
          } else {
            console.log('Keeping isStreaming as TRUE, other active messages exist:', 
              Object.keys(streamingMessages).filter(id => id !== streamingId));
          }
          
          setCurrentStreamingId(null);
          setStreamingMessages(prev => {
            const updated = {...prev};
            if (streamingId in updated) {
              delete updated[streamingId];
            }
            console.log('Removing message from streamingMessages:', streamingId);
            console.log('streamingMessages after removal:', updated);
            return updated;
          });
          
          // Clean up the content in streamingContents
          setStreamingContents(prev => {
            const updated = {...prev};
            if (streamingId in updated) {
              delete updated[streamingId];
            }
            return updated;
          });
          
          // Save the complete message to the database
          const assistantMessage = await MessageService.createMessage({
            content: data.fullResponse || streamingMessage,
            userId: user.id,
            senderType: MessageSenderType.Assistant,
            contextType,
            contextId: contextId || undefined
          });
          
          // Update chat history with the final message
          setChatHistory(prev => 
            prev.map(msg => 
              msg.id === streamingId ? assistantMessage : msg
            )
          );
        },
        onTool: (toolName, args) => {
          console.log(`Tool called: ${toolName}`, args);
          // Handle tool calls here if needed
        }
      });
      
      // Store the close function
      streamCloseRef.current = close;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Handle editing a message
  const handleEditMessage = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  // Handle saving an edited message
  const handleSaveEdit = async (messageId: string, newContent: string) => {
    if (!user) return;
    
    setIsEditing(true);
    
    try {
      // Update the message in the database
      const updatedMessage = await MessageService.updateMessage(
        messageId,
        newContent,
        user.id
      );
      
      // Update the chat history with the updated message
      setChatHistory(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );
      
      // Track this message as edited in our local state
      setEditedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.add(messageId);
        return newSet;
      });
      
      toast({
        title: "Message updated",
        description: "Your message has been successfully edited.",
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error updating message",
        description: "Your message could not be updated. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditingMessageId(null);
      setIsEditing(false);
    }
  };

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // Delete the message from the database
      await MessageService.deleteMessage(messageId, user.id);
      
      // Remove the message from the chat history
      setChatHistory(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message deleted",
        description: "Your message has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error deleting message",
        description: "Your message could not be deleted. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Debug effect for streaming message updates
  useEffect(() => {
    if (streamingMessage && isStreaming) {
      console.log('streamingMessage state updated:', streamingMessage.substring(0, 50) + (streamingMessage.length > 50 ? '...' : ''));
      console.log('Current streaming ID:', currentStreamingId);
    }
  }, [streamingMessage, isStreaming]);
  
  // Debug effect for streaming contents map
  useEffect(() => {
    console.log('streamingContents map updated:', streamingContents);
  }, [streamingContents]);

  // Debug effect for streaming messages map
  useEffect(() => {
    console.log('streamingMessages map updated:', streamingMessages);
    console.log('isStreaming state:', isStreaming);
  }, [streamingMessages, isStreaming]);
  
  // Debug effect for current streaming ID changes
  useEffect(() => {
    console.log('currentStreamingId changed:', currentStreamingId);
  }, [currentStreamingId]);
  
  // Debug effect for chat history changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      console.log('Chat history updated, last message ID:', lastMessage.id);
      
      // Check if the last message matches the current streaming ID
      if (currentStreamingId && lastMessage.id === currentStreamingId) {
        console.log('✅ Last message matches currentStreamingId');
      } else if (currentStreamingId) {
        console.log('❌ Last message does NOT match currentStreamingId');
        console.log('Last message:', lastMessage);
      }
    }
  }, [chatHistory, currentStreamingId]);
  
  // Chat content (messages and input)
  const chatContent = (
    <>
      {/* Context display */}
      <div className="bg-muted/50 rounded-lg p-2 mb-3 text-sm text-muted-foreground flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <span>@project:</span>
          <span className="font-medium">{projectName}</span>
        </div>
        {!isProjectOnlyMode && (
          <div className="flex items-center gap-1">
            <span>@document:</span>
            <span className="font-medium">{documentName}</span>
          </div>
        )}
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-4 space-y-2 p-2">
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="md" />
          </div>
        ) : chatHistory.length === 0 ? (
          <p className="text-muted-foreground text-center p-4">
            {isProjectOnlyMode 
              ? "Ask questions about your project or get help organizing your content."
              : "Ask questions about your document or get help with your content."}
          </p>
        ) : (
          <>
            {chatHistory.map((chat) => {
              return (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg relative group ${
                    String(chat.sender_type) === 'user'
                      ? 'bg-primary/10 ml-8 mr-0 pl-2'
                      : 'bg-secondary/20 mr-8 ml-0 pr-2'
                  }`}
                >
                  {/* User messages with edit capability */}
                  {String(chat.sender_type) === 'user' && chat.id !== `temp-${Date.now()}` && (
                    <>
                      {editingMessageId === chat.id ? (
                        /* Edit mode */
                        <MessageEditor
                          message={chat}
                          onSave={handleSaveEdit}
                          onCancel={() => setEditingMessageId(null)}
                          isLoading={isEditing}
                        />
                      ) : (
                        /* Display mode with actions */
                        <>
                          <MessageActions
                            message={chat}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            isMobile={!isStandalone && isMobileScreen}
                            position="left"
                          />
                          <MarkdownRenderer 
                            content={chat.content} 
                            className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                          />
                          {(chat.isEdited || editedMessageIds.has(chat.id)) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span>(edited)</span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Assistant messages (never editable) */}
                  {String(chat.sender_type) === 'assistant' && (
                    <>
                      <MessageActions
                        message={chat}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        isMobile={!isStandalone && isMobileScreen}
                        canEdit={false}
                        position="right"
                      />
                      {/* For streaming messages */}
                      {(() => {
                        // ONLY check if the message is in streamingMessages map, don't check isStreaming
                        const shouldShowStreaming = chat.id in streamingMessages;
                        console.log(`Checking streaming for message ${chat.id}:`, {
                          isStreaming,
                          'chat.id in streamingMessages': chat.id in streamingMessages,
                          'shouldShowStreaming': shouldShowStreaming
                        });
                        return shouldShowStreaming ? (
                          <MarkdownRenderer 
                            content={streamingContents[chat.id] || "Generating response..."} 
                            className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                          />
                        ) : (
                          <MarkdownRenderer 
                            content={chat.content} 
                            className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                          />
                        );
                      })()}
                    </>
                  )}
                </div>
              );
            })}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {isLoading && !isInitialLoading && (
          <div className="flex items-center justify-center p-2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="flex gap-2 mt-auto p-0.5 pb-1.5">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isProjectOnlyMode 
            ? "Ask about your project... (Ctrl+Enter or Shift+Enter to send)" 
            : "Ask about your document... (Ctrl+Enter or Shift+Enter to send)"}
          className="flex-1 min-h-[60px] max-h-[240px] resize-none overflow-y-auto"
          style={{
            height: 'auto',
            overflowY: message.split('\n').length > 10 ? 'scroll' : 'hidden'
          }}
          rows={Math.min(message.split('\n').length || 1, 10)}
          disabled={isLoading || isInitialLoading || !user}
        />
        <Button 
          onClick={sendMessage} 
          type="submit" 
          className="h-auto self-end mb-1" 
          disabled={isLoading || isInitialLoading || !user}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
  
  // If in mobile standalone mode or in a tab, return without card wrapper
  if (isStandalone) {
    return (
      <div 
        className={`h-full flex flex-col p-4 ${className}`}
        data-chat-container
      >
        <div className="flex flex-col gap-1 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {isProjectOnlyMode ? "Project Assistant" : "Document Assistant"}
            </h2>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {chatContent}
        </div>
      </div>
    );
  }
  
  // In desktop sidebar, use card container
  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span>{isProjectOnlyMode ? "Project Assistant" : "Document Assistant"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {chatContent}
      </CardContent>
    </Card>
  );
}; 