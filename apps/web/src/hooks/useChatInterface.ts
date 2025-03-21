import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageService } from '@/features/documents/services/messageService.js';
import { createAIStream } from '@/features/documents/services/sseClient.js';
import { 
  Message as MessageModel, 
  MessageSenderType, 
  MessageContextType,
  CreateMessageParams
} from '@/features/documents/models/message.js';
import { useAuth } from './useAuth.ts';
import { useToast } from './use-toast.ts';

interface UseChatInterfaceProps {
  contextType: MessageContextType;
  contextId?: string | null;
  documentTitle?: string;
  documentContent?: string;
  projectId?: string;
  projectName?: string;
}

interface StreamingState {
  isStreaming: boolean;
  streamingContents: Record<string, string>;
  streamingMessages: Record<string, boolean>;
  currentStreamingId: string | null;
}

export function useChatInterface({
  contextType,
  contextId,
  documentTitle,
  documentContent,
  projectId,
  projectName
}: UseChatInterfaceProps) {
  // Message state
  const [chatHistory, setChatHistory] = useState<MessageModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedMessageIds, setEditedMessageIds] = useState<Set<string>>(new Set());
  
  // Streaming state
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamingContents: {},
    streamingMessages: {},
    currentStreamingId: null
  });
  
  // Refs
  const streamCloseRef = useRef<(() => void) | null>(null);
  const contextSwitchRef = useRef(false);
  const prevContextRef = useRef<{contextType?: MessageContextType, contextId?: string | null}>({});
  
  // Services
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Helper function to update streaming state
  const updateStreamingState = useCallback((updates: Partial<StreamingState>) => {
    setStreamingState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
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
  }, [contextType, contextId, user, toast]);
  
  // Send a message and start streaming the response
  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !user) return;
    
    // Add user message to chat (optimistic update)
    const userMessage: MessageModel = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      user_id: user.id,
      sender_type: MessageSenderType.User,
      context_type: contextType,
      context_id: contextId ?? null,
      createdAt: new Date(),
      has_proposed_changes: false,
      display_thread_id: null,
      reply_to_message_id: null
    };
    
    // Append to history
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Save the message to the database
      const savedMessage = await MessageService.createMessage({
        content: messageContent,
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
      
      // Update streaming state
      updateStreamingState({
        isStreaming: true,
        currentStreamingId: streamingId,
        streamingMessages: {
          ...streamingState.streamingMessages,
          [streamingId]: true
        }
      });
      
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
        context_id: contextId ?? null,
        createdAt: new Date(),
        has_proposed_changes: false,
        display_thread_id: null,
        reply_to_message_id: null
      };
      
      // Add the streaming placeholder to chat history
      setChatHistory(prev => [...prev, streamingPlaceholder]);
      
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
        documentTitle: documentTitle,
        documentContent: documentContent,
        projectId: projectId || undefined,
        projectName: projectName,
        onConnectionChange: (connected) => {
          if (!connected) {
            setIsLoading(false);
            updateStreamingState({ isStreaming: false });
          }
        },
        onChunk: (chunk) => {
          // Update streaming content for this specific message ID
          setStreamingState(prev => {
            const updatedContents = {
              ...prev.streamingContents,
              [streamingId]: (prev.streamingContents[streamingId] || '') + chunk
            };
            
            return {
              ...prev,
              streamingContents: updatedContents
            };
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
          
          // Cleanup streaming state
          setStreamingState(prev => {
            // Check if there are other active streaming messages
            const updatedMessages = {...prev.streamingMessages};
            delete updatedMessages[streamingId];
            
            const updatedContents = {...prev.streamingContents};
            delete updatedContents[streamingId];
            
            return {
              isStreaming: Object.keys(updatedMessages).length > 0,
              streamingMessages: updatedMessages,
              streamingContents: updatedContents,
              currentStreamingId: Object.keys(updatedMessages).length > 0 ? prev.currentStreamingId : null
            };
          });
        },
        onComplete: async (data) => {
          setIsLoading(false);
          
          // Handle the server-side saved message
          if (data.messageId) {
            try {
              // Fetch the message from the database to get the full message object
              const assistantMessage = await MessageService.getMessage(data.messageId);
              
              // Update chat history with the final message
              setChatHistory(prev => 
                prev.map(msg => 
                  msg.id === streamingId ? assistantMessage : msg
                )
              );
              
              // Only clear streaming state AFTER we've updated the chat history
              // This prevents the flash of empty content during the transition
              setStreamingState(prev => {
                const updatedMessages = {...prev.streamingMessages};
                delete updatedMessages[streamingId];
                
                const updatedContents = {...prev.streamingContents};
                delete updatedContents[streamingId];
                
                return {
                  isStreaming: Object.keys(updatedMessages).length > 0,
                  streamingMessages: updatedMessages,
                  streamingContents: updatedContents,
                  currentStreamingId: Object.keys(updatedMessages).length > 0 ? prev.currentStreamingId : null
                };
              });
            } catch (error) {
              console.error('Error fetching saved message:', error);
              
              // Show error to user but don't attempt to save client-side
              toast({
                title: "Error retrieving message",
                description: "There was an issue retrieving the message from the server.",
                variant: "destructive"
              });
              
              // Clean up streaming state since we had an error
              setStreamingState(prev => {
                const updatedMessages = {...prev.streamingMessages};
                delete updatedMessages[streamingId];
                
                const updatedContents = {...prev.streamingContents};
                delete updatedContents[streamingId];
                
                return {
                  isStreaming: Object.keys(updatedMessages).length > 0,
                  streamingMessages: updatedMessages,
                  streamingContents: updatedContents,
                  currentStreamingId: Object.keys(updatedMessages).length > 0 ? prev.currentStreamingId : null
                };
              });
              
              // Remove the streaming placeholder since we couldn't get the real message
              setChatHistory(prev => prev.filter(msg => msg.id !== streamingId));
            }
          } else {
            // Message was not saved server-side
            if (data.messageError) {
              console.error('Server-side message save error:', data.messageError);
            }
            
            // Show error to user
            toast({
              title: "Message not saved",
              description: "Your message could not be saved on the server.",
              variant: "destructive"
            });
            
            // Clean up streaming state
            setStreamingState(prev => {
              const updatedMessages = {...prev.streamingMessages};
              delete updatedMessages[streamingId];
              
              const updatedContents = {...prev.streamingContents};
              delete updatedContents[streamingId];
              
              return {
                isStreaming: Object.keys(updatedMessages).length > 0,
                streamingMessages: updatedMessages,
                streamingContents: updatedContents,
                currentStreamingId: Object.keys(updatedMessages).length > 0 ? prev.currentStreamingId : null
              };
            });
            
            // Remove the streaming placeholder since we don't have a real message
            setChatHistory(prev => prev.filter(msg => msg.id !== streamingId));
          }
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
      updateStreamingState({ isStreaming: false });
    }
  };

  // Handle editing a message
  const editMessage = async (messageId: string, newContent: string) => {
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
      
      return true;
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error updating message",
        description: "Your message could not be updated. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setEditingMessageId(null);
      setIsEditing(false);
    }
  };

  // Handle deleting a message
  const deleteMessage = async (messageId: string) => {
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
      
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error deleting message",
        description: "Your message could not be deleted. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };
  
  return {
    // Message state
    chatHistory,
    isLoading,
    isInitialLoading,
    
    // Editing state
    editingMessageId,
    setEditingMessageId,
    isEditing,
    isDeleting,
    editedMessageIds,
    
    // Streaming state
    isStreaming: streamingState.isStreaming,
    streamingContents: streamingState.streamingContents,
    streamingMessages: streamingState.streamingMessages,
    currentStreamingId: streamingState.currentStreamingId,
    
    // Methods
    sendMessage,
    editMessage,
    deleteMessage
  };
} 