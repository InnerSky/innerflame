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
import { limitChatHistoryTokens } from '@/utils/textUtils.js';
import {
  containsDocumentEditTags,
  parseDocumentEdit,
  DocumentEditTagState,
  parseStreamingSegments,
  SegmentType
} from '@/features/documents/utils/documentEditUtils.js';
import { useDocumentsContext } from '@/features/documents/contexts/DocumentsContext.js';

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
  documentEditStates: Record<string, DocumentEditTagState>;
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
    currentStreamingId: null,
    documentEditStates: {}
  });
  
  // Refs
  const streamCloseRef = useRef<(() => void) | null>(null);
  const contextSwitchRef = useRef(false);
  const prevContextRef = useRef<{contextType?: MessageContextType, contextId?: string | null}>({});
  const hasLoadedMessagesRef = useRef<boolean>(false);
  const loadingContextRef = useRef<{contextType?: MessageContextType, contextId?: string | null}>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Services
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get documents context for document refresh
  const documentsContext = useDocumentsContext();
  
  // Store the latest streaming content for state management
  const latestStreamingContentRef = useRef<Record<string, string>>({});
  
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
      hasLoadedMessagesRef.current = false;
      
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
    // Prevent redundant loads for the same context
    const contextSignature = `${contextType}:${contextId || 'none'}`;
    const currentlyLoadingSignature = `${loadingContextRef.current.contextType}:${loadingContextRef.current.contextId || 'none'}`;
    
    // Check if we've already loaded messages for this context
    if (hasLoadedMessagesRef.current && contextSignature === currentlyLoadingSignature) {
      return;
    }
    
    // Update the loading context reference
    loadingContextRef.current = { contextType, contextId };
    
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
        
        // Process loaded messages for document edits
        const documentEditStates: Record<string, DocumentEditTagState> = {};
        
        messages.forEach(message => {
          if (message.sender_type === 'assistant' && message.content) {
            if (containsDocumentEditTags(message.content)) {
              const editData = parseDocumentEdit(message.content);
              documentEditStates[message.id] = editData.state;
            }
          }
        });
        
        setChatHistory(messages);
        
        // Update document edit states if any were found
        if (Object.keys(documentEditStates).length > 0) {
          updateStreamingState({ documentEditStates });
        }
        
        // Mark this context as having been loaded
        hasLoadedMessagesRef.current = true;
      } catch (error) {
        console.error('[useChatInterface] Error loading messages:', error);
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
  }, [contextType, contextId, user, toast, updateStreamingState]);
  
  // Process streaming content for document edits
  const processDocumentEditTags = useCallback((messageId: string, content: string) => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a debounced timer to prevent too many state updates
    debounceTimerRef.current = setTimeout(() => {
      // Check for document edit tags first
      if (containsDocumentEditTags(content)) {
        // If found, use the original approach which has the correct types
        const editData = parseDocumentEdit(content);
        
        // Only update if the state has changed
        setStreamingState(prev => {
          const currentState = prev.documentEditStates[messageId];
          
          // Log state transitions for debugging
          if (currentState !== editData.state) {
            console.log(`Document edit state transition: ${currentState} -> ${editData.state}`, { 
              hasContentTag: content.includes('<content>'),
              contentLength: editData.content?.length
            });
          }
          
          if (currentState === editData.state) {
            return prev;
          }
          
          return {
            ...prev,
            documentEditStates: {
              ...prev.documentEditStates,
              [messageId]: editData.state
            }
          };
        });
      }
      
      debounceTimerRef.current = null;
    }, 50); // Reduce debounce to 50ms to be more responsive to state changes
  }, []);
  
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
        },
        documentEditStates: {
          ...streamingState.documentEditStates,
          [streamingId]: DocumentEditTagState.NONE
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
      
      // Limit chat history to ~2000 tokens (excluding the current message)
      const filteredHistory = limitChatHistoryTokens(
        chatHistory.filter(msg => msg.id !== userMessage.id),
        2000
      );
      
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
        chatHistory: filteredHistory,
        onConnectionChange: (connected) => {
          if (!connected) {
            setIsLoading(false);
            updateStreamingState({ isStreaming: false });
          }
        },
        onChunk: (chunk) => {
          // Update streaming content for this specific message ID
          setStreamingState(prev => {
            // Add the new chunk to existing content
            const updatedContent = (prev.streamingContents[streamingId] || '') + chunk;
            
            // Check for document edit tags and parse immediately
            let updatedDocumentEditStates = {...prev.documentEditStates};
            if (containsDocumentEditTags(updatedContent)) {
              const editData = parseDocumentEdit(updatedContent);
              const currentState = prev.documentEditStates[streamingId];
              
              // Log state transitions for debugging
              if (currentState !== editData.state) {
                console.log(`Document edit state transition: ${currentState} -> ${editData.state}`, { 
                  hasContentTag: updatedContent.includes('<content>'),
                  contentLength: editData.content?.length
                });
              }
              
              // Update state
              updatedDocumentEditStates = {
                ...updatedDocumentEditStates,
                [streamingId]: editData.state
              };
            }
            
            // Update streaming state - both content and document edit state
            return {
              ...prev,
              streamingContents: {
                ...prev.streamingContents,
                [streamingId]: updatedContent
              },
              documentEditStates: updatedDocumentEditStates
            };
          });
          
          // Remove debounced tag processing - we now do it directly
          // processDocumentEditTags(
          //   streamingId, 
          //   (streamingState.streamingContents[streamingId] || '') + chunk
          // );
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
            
            const updatedDocumentEditStates = {...prev.documentEditStates};
            delete updatedDocumentEditStates[streamingId];
            
            return {
              isStreaming: Object.keys(updatedMessages).length > 0,
              streamingMessages: updatedMessages,
              streamingContents: updatedContents,
              documentEditStates: updatedDocumentEditStates,
              currentStreamingId: Object.keys(updatedMessages).length > 0 ? prev.currentStreamingId : null
            };
          });
        },
        onComplete: async (data) => {
          setIsLoading(false);
          
          // If there is a document edit that was successfully processed
          if (data.documentEdit?.updated) {
            console.log('Document edit detected and processed with new version:', data.documentEdit.versionNumber);
            
            // If this is a document context, we can refresh the document
            if (contextType === MessageContextType.Document && contextId) {
              // If we have a selected document that matches, refresh it
              if (documentsContext.selectedDocument?.id === contextId) {
                // Fetch document versions to update UI
                documentsContext.fetchDocumentVersions(contextId);
                
                // Properly refresh the document selection instead of directly manipulating editor content
                try {
                  const repository = new (await import('@/features/documents/repositories/documentRepository.js')).DocumentRepository();
                  const updatedDoc = await repository.getDocumentWithVersions(contextId);
                  
                  if (updatedDoc) {
                    if (documentsContext.hasUnsavedChanges) {
                      // Show a notification about the version update but don't override current edits
                      toast({
                        title: "Document Updated in Background",
                        description: `AI edit applied as version ${data.documentEdit.versionNumber}. Refresh document to view changes.`,
                        variant: "default"
                      });
                      
                      // Still update version list
                      documentsContext.fetchDocumentVersions(contextId);
                    } else {
                      // No unsaved changes, safe to switch to the new version
                      documentsContext.selectDocument(updatedDoc);
                      
                      toast({
                        title: "Document Updated",
                        description: `AI edit applied as version ${data.documentEdit.versionNumber}`,
                        variant: "default"
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error refreshing document:', error);
                }
              }
            }
          } else if (data.documentEdit?.processed && data.documentEdit?.error) {
            // If there was an error processing the document edit
            console.error('Error processing document edit:', data.documentEdit.error);
            
            // Show a toast notification
            toast({
              title: "Document Update Failed",
              description: data.documentEdit.error,
              variant: "destructive"
            });
          }
          
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
                
                const updatedDocumentEditStates = {...prev.documentEditStates};
                delete updatedDocumentEditStates[streamingId];
                
                return {
                  isStreaming: Object.keys(updatedMessages).length > 0,
                  streamingMessages: updatedMessages,
                  streamingContents: updatedContents,
                  documentEditStates: updatedDocumentEditStates,
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
                
                const updatedDocumentEditStates = {...prev.documentEditStates};
                delete updatedDocumentEditStates[streamingId];
                
                return {
                  isStreaming: Object.keys(updatedMessages).length > 0,
                  streamingMessages: updatedMessages,
                  streamingContents: updatedContents,
                  documentEditStates: updatedDocumentEditStates,
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
              
              const updatedDocumentEditStates = {...prev.documentEditStates};
              delete updatedDocumentEditStates[streamingId];
              
              return {
                isStreaming: Object.keys(updatedMessages).length > 0,
                streamingMessages: updatedMessages,
                streamingContents: updatedContents,
                documentEditStates: updatedDocumentEditStates,
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
  
  // React to streaming state changes and ensure we consistently check for document edits
  useEffect(() => {
    // Update the latestStreamingContentRef with the current streamingContents
    latestStreamingContentRef.current = streamingState.streamingContents;
    
    // If we have active streaming messages, set up a refresh interval
    if (streamingState.isStreaming && Object.keys(streamingState.streamingMessages).length > 0) {
      // Refresh document edit states every 200ms to ensure we catch all state changes
      const refreshInterval = setInterval(() => {
        const updatedStates: Record<string, DocumentEditTagState> = {};
        let hasChanges = false;
        
        // Check each streaming message for document edit state changes
        Object.keys(streamingState.streamingMessages).forEach(msgId => {
          const content = latestStreamingContentRef.current[msgId];
          if (content && containsDocumentEditTags(content)) {
            const editData = parseDocumentEdit(content);
            const currentState = streamingState.documentEditStates[msgId];
            
            // Only update if the state has changed
            if (currentState !== editData.state) {
              updatedStates[msgId] = editData.state;
              hasChanges = true;
              
              console.log(`Refresh interval - State update: ${currentState} -> ${editData.state}`, {
                messageId: msgId,
                hasContentTag: content.includes('<content>'),
                contentLength: editData.content?.length
              });
            }
          }
        });
        
        // Update the streaming state if we have changes
        if (hasChanges) {
          setStreamingState(prev => ({
            ...prev,
            documentEditStates: {
              ...prev.documentEditStates,
              ...updatedStates
            }
          }));
        }
      }, 200);
      
      return () => clearInterval(refreshInterval);
    }
  }, [streamingState.isStreaming, streamingState.streamingMessages]);
  
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
    documentEditStates: streamingState.documentEditStates,
    
    // Methods
    sendMessage,
    editMessage,
    deleteMessage
  };
} 