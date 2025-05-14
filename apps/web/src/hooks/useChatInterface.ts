import { useState, useEffect, useRef, useCallback, SetStateAction } from 'react';
import { MessageServiceStatic as MessageService, messageSubscriptionService } from '@/lib/services.js';
import { createAIStream } from '@/features/documents/services/sseClient.js';
import { 
  Message as MessageModel, 
  MessageSenderType, 
  MessageContextType,
  CreateMessageParams
} from '@innerflame/types';
import { useAuth } from '@/contexts/AuthContext.js';
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
  const chatHistoryRef = useRef<MessageModel[]>([]);
  const idSetRef = useRef(new Set<string>());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Add completion tracking to prevent duplicate onComplete processing
  const completedStreamsRef = useRef<Set<string>>(new Set());
  
  // Track message IDs to detect duplicates
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    
    // Check for duplicates
    const messageIds = chatHistory.map(m => m.id);
    const uniqueIds = new Set(messageIds);
    
    if (uniqueIds.size !== messageIds.length) {
      // Find the duplicated IDs
      const counts: Record<string, number> = {};
      const duplicates: string[] = [];
      
      messageIds.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
        if (counts[id] > 1 && !duplicates.includes(id)) {
          duplicates.push(id);
        }
      });
      
      console.error('🔴 DUPLICATE MESSAGES DETECTED', {
        duplicateIds: duplicates,
        messageIds,
        currentState: chatHistory.map(m => ({ id: m.id, content: m.content.substring(0, 20) }))
      });
    }
    
    // Update ID set for future reference
    idSetRef.current = uniqueIds;
  }, [chatHistory]);
  
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
  
  // Add subscription cleanup ref
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);
  // Ref to track previous subscription context signature
  const prevSubscriptionSignatureRef = useRef<string>('');
  
  // Services
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get documents context for document refresh
  const documentsContext = useDocumentsContext();
  
  // Store the latest streaming content for state management
  const latestStreamingContentRef = useRef<Record<string, string>>({});
  
  // Add ref to track recently processed message IDs to prevent duplicates
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  
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
          
          if (currentState !== editData.state) {
            // Remove log for state transitions
            // console.log(`Document edit state transition: ${currentState} -> ${editData.state}`, { 
            //   hasContentTag: content.includes('<content>'),
            //   contentLength: editData.content?.length
            // });
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
  
  // Clean state updater without debug logging
  const updateChatHistory = useCallback((updater: SetStateAction<MessageModel[]>) => {
    if (typeof updater === 'function') {
      setChatHistory(prev => {
        try {
          return updater(prev);
        } catch (error) {
          console.error('Error updating chat history:', error);
          return prev;
        }
      });
    } else {
      setChatHistory(updater);
    }
  }, []);
  
  // Send a message and start streaming the response
  const sendMessage = async (messageData: string | { content: string, agentType?: string }) => {
    // Extract message content and options
    const messageContent = typeof messageData === 'string' ? messageData : messageData.content;
    const agentType = typeof messageData === 'string' ? undefined : messageData.agentType;
    
    if (!messageContent.trim() || isLoading || !user) return;
    
    // Get the current document version ID when in document context
    const contextEntityVersionId = contextType === MessageContextType.Document && contextId && documentsContext.selectedDocument?.currentVersionId
      ? documentsContext.selectedDocument.currentVersionId
      : null;
    
    // Add user message to chat (optimistic update)
    const userMessage: MessageModel = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      user_id: user.id,
      sender_type: MessageSenderType.User,
      context_type: contextType,
      context_id: contextId ?? null,
      context_entity_version_id: contextEntityVersionId,
      reply_to_message_id: null,
      inhistory_id: null,
      createdAt: new Date(),
      isEdited: false
    };
    
    // Append to history
    updateChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Save the message to the database
      const savedMessage = await MessageService.createMessage({
        content: messageContent,
        userId: user.id,
        senderType: MessageSenderType.User,
        contextType,
        contextId: contextId || undefined,
        contextEntityVersionId: contextEntityVersionId // Pass the version ID directly, not converting null to undefined
      });
      
      // Replace the temporary message with the saved one
      updateChatHistory(prev => 
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
        context_entity_version_id: contextEntityVersionId,
        reply_to_message_id: null,
        inhistory_id: null,
        createdAt: new Date(),
        isEdited: false
      };
      
      // Add the streaming placeholder to chat history
      updateChatHistory(prev => [...prev, streamingPlaceholder]);
      
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
        agentType,
        contextEntityVersionId: contextEntityVersionId ?? undefined, // Convert null to undefined
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
              
              // Remove log for state transitions
              // console.log(`Document edit state transition: ${currentState} -> ${editData.state}`, { 
              //   hasContentTag: updatedContent.includes('<content>'),
              //   contentLength: editData.content?.length
              // });
              
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
          
          // Skip if already completed this stream
          const streamKey = `${streamingId}:${data.messageId || 'unknown'}`;
          if (completedStreamsRef.current.has(streamKey)) {
            return;
          }
          
          // Mark as completed
          completedStreamsRef.current.add(streamKey);
          
          // If there is a document edit that was successfully processed
          if (data.documentEdit?.updated) {
            // Document edit was applied, we should refresh the document
            if (documentsContext?.fetchDocumentVersions && documentsContext.selectedDocument?.id) {
              try {
                // Fetch document versions to reflect the updated version
                await documentsContext.fetchDocumentVersions(documentsContext.selectedDocument.id);
              } catch (error) {
                console.error('Error fetching document versions after edit:', error);
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
              // Add this message ID to our processed list to prevent duplicates from real-time subscriptions
              processedMessageIdsRef.current.add(data.messageId);
              
              // Clean up old processed IDs after a delay (10 seconds should be plenty)
              setTimeout(() => {
                processedMessageIdsRef.current.delete(data.messageId);
              }, 10000);
              
              // Fetch the message from the database to get the full message object
              const assistantMessage = await MessageService.getMessage(data.messageId);
              
              // Check if the message already exists in history BEFORE we attempt to update
              const messageExistsInHistory = chatHistoryRef.current.some(msg => msg.id === assistantMessage.id);
              const streamingMessageExists = chatHistoryRef.current.some(msg => msg.id === streamingId);
              
              // If the final message is already in history AND the streaming message is gone,
              // this is likely a duplicate onComplete - we can skip all further processing
              if (messageExistsInHistory && !streamingMessageExists) {
                return;
              }
              
              // Modify how we update the chat history to be more careful
              updateChatHistory(prev => {
                // Check several scenarios
                const hasStreaming = prev.some(msg => msg.id === streamingId);
                const hasFinal = prev.some(msg => msg.id === assistantMessage.id);
                
                if (hasFinal && hasStreaming) {
                  // Both exist - remove streaming message
                  return prev.filter(msg => msg.id !== streamingId);
                } else if (hasFinal) {
                  // Final already exists somehow - don't add again
                  return prev;
                } else if (hasStreaming) {
                  // Normal case - replace streaming with final
                  return prev.map(msg => 
                    msg.id === streamingId ? assistantMessage : msg
                  );
                } else {
                  // Shouldn't happen - add final message as fallback
                  return [...prev, assistantMessage];
                }
              });
            } catch (error) {
              console.error('Error fetching saved message:', error);
              
              // Remove the streaming placeholder since we couldn't get the real message
              updateChatHistory(prev => prev.filter(msg => msg.id !== streamingId));
            } finally {
              // Clean up completed streams after a delay (to be safe)
              setTimeout(() => {
                completedStreamsRef.current.delete(streamKey);
              }, 10000);
            }
          } else {
            // Signal that streaming is done but we don't have a message ID
            console.warn('Stream complete but no message ID provided');
            
            // Remove the streaming placeholder since we don't have a real message
            updateChatHistory(prev => prev.filter(msg => msg.id !== streamingId));
            
            // Clean up completed streams after a delay (to be safe)
            setTimeout(() => {
              completedStreamsRef.current.delete(streamKey);
            }, 10000);
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

  /**
   * Edit a message
   */
  const editMessage = async (messageId: string, newContent: string) => {
    if (!user || isEditing) return false;
    
    // Find the original message
    const message = chatHistory.find(m => m.id === messageId);
    if (!message) return false;
    
    // Store original content for rollback if needed
    const originalContent = message.content;
    
    // Optimistically update UI
    updateChatHistory(prev => prev.map(m => 
      m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
    ));
    
    // Add to edited message IDs
    setEditedMessageIds(prev => {
      const newSet = new Set(prev);
      newSet.add(messageId);
      return newSet;
    });
    
    try {
      setIsEditing(true);
      
      // Actually update the message in the database
      await MessageService.updateMessage(messageId, newContent, user.id);
      
      // Success - already updated UI
      setEditingMessageId(null);
      return true;
    } catch (error) {
      console.error(`Error editing message ${messageId}:`, error);
      
      // On error, revert to original content
      updateChatHistory(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: originalContent } : m
      ));
      
      // If the message wasn't previously edited, remove from edited set
      if (!message.isEdited) {
        setEditedMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }
      
      toast({
        title: "Error editing message",
        description: "Failed to edit the message. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsEditing(false);
    }
  };

  /**
   * Delete a message
   */
  const deleteMessage = async (messageId: string) => {
    if (!user || isDeleting) return false;
    
    // Don't wait for backend - update UI immediately
    updateChatHistory(prev => prev.filter(message => message.id !== messageId));
    
    // If this is the message being edited, cancel editing
    if (editingMessageId === messageId) {
      setEditingMessageId(null);
    }
    
    try {
      setIsDeleting(true);
      const success = await MessageService.deleteMessage(messageId, user.id);
      // No need to update the chatHistory again since the real-time subscription will handle it
      // or we've already updated it optimistically
      return success;
    } catch (error) {
      console.error(`Error deleting message ${messageId}:`, error);
      
      // On error, restore the message
      const message = chatHistory.find(m => m.id === messageId);
      if (message) {
        updateChatHistory(prev => {
          // If message was already added back by real-time, don't add it again
          if (prev.some(m => m.id === messageId)) {
            return prev;
          }
          // Add back and sort
          const updatedMessages = [...prev, message].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return updatedMessages;
        });
      }
      
      toast({
        title: "Error deleting message",
        description: "Failed to delete the message. Please try again.",
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
  
  // Subscribe to real-time updates for the current context
  useEffect(() => {
    if (!user) return;

    // Generate subscription context signature
    const subscriptionContextSignature = `${contextType}:${contextId || 'none'}`;
    
    // Only resubscribe if context actually changed
    if (subscriptionContextSignature === prevSubscriptionSignatureRef.current && subscriptionCleanupRef.current) {
      return; // Skip if the context hasn't changed and we already have a subscription
    }
    
    // Update the context signature ref
    prevSubscriptionSignatureRef.current = subscriptionContextSignature;
    
    // Debounce subscription creation to avoid rapid setup/teardown cycles
    const setupSubscription = () => {
      // Clean up any existing subscription
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
      
      // Only subscribe if we have a valid context
      if (contextType !== undefined) {
        // Remove log for subscription setup
        // console.log(`Setting up real-time subscription for context: ${contextType}, ID: ${contextId || 'none'}`);
        
        // Subscribe to messages for this context
        const unsubscribe = messageSubscriptionService.subscribeToMessages(contextType, contextId);
        
        // Set up handlers for each event type
        const insertHandler = messageSubscriptionService.onMessageInserted((newMessage) => {
          // Skip temporary messages
          if (newMessage.id.startsWith('temp-')) {
            return;
          }
          
          // ENHANCED DUPLICATE DETECTION
          // 1. Check if message is in our processed list from onComplete
          // 2. Check if message already exists in chat history
          // 3. Check if it's in a recently completed stream
          
          const isProcessed = processedMessageIdsRef.current.has(newMessage.id);
          const existsInHistory = chatHistoryRef.current.some(m => m.id === newMessage.id);
          
          // Check all completed stream keys for this message ID
          const isInCompletedStream = Array.from(completedStreamsRef.current).some(key => 
            key.endsWith(`:${newMessage.id}`)
          );
          
          // Skip already processed/existing messages through ANY mechanism
          if (isProcessed || existsInHistory || isInCompletedStream) {
            return;
          }
          
          // Only add the message if it's not already in the chat history
          updateChatHistory(prev => {
            // Double-check if message already exists (in case state changed after our check)
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            
            // Sort messages by creation date - oldest first
            const updatedMessages = [...prev, newMessage].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            
            return updatedMessages;
          });
        });
        
        const updateHandler = messageSubscriptionService.onMessageUpdated((updatedMessage) => {
          // Skip temporary messages
          if (updatedMessage.id.startsWith('temp-')) {
            return;
          }
          
          updateChatHistory(prev => {
            // Check if message exists in the current history
            if (!prev.some(m => m.id === updatedMessage.id)) {
              return prev;
            }
            
            // Find and update the message
            return prev.map(message => 
              message.id === updatedMessage.id ? updatedMessage : message
            );
          });
          
          // Add to edited message IDs if not already there
          setEditedMessageIds(prev => {
            if (prev.has(updatedMessage.id)) {
              return prev;
            }
            const newSet = new Set(prev);
            newSet.add(updatedMessage.id);
            return newSet;
          });
          
          // If this is the message being edited, cancel editing
          if (editingMessageId === updatedMessage.id) {
            setEditingMessageId(null);
          }
        });
        
        const deleteHandler = messageSubscriptionService.onMessageDeleted((deletedMessage) => {
          // Skip temporary messages
          if (deletedMessage.id.startsWith('temp-')) {
            return;
          }
          
          // For DELETE events, we may only receive the ID
          // Simply check if we have this message in our history and remove it
          updateChatHistory(prev => {
            // Check if message exists in the current history
            const messageExists = prev.some(m => m.id === deletedMessage.id);
            
            if (!messageExists) {
              return prev;
            }
            
            return prev.filter(message => message.id !== deletedMessage.id);
          });
          
          // If this is the message being edited, cancel editing
          if (editingMessageId === deletedMessage.id) {
            setEditingMessageId(null);
          }
        });
        
        // Combine all cleanup functions
        subscriptionCleanupRef.current = () => {
          unsubscribe();
          insertHandler();
          updateHandler();
          deleteHandler();
        };
      }
    };

    // Small delay to avoid rapid setup/teardown during component mounting/effects chain
    const timeoutId = setTimeout(setupSubscription, 100);
    
    // Clean up subscription when component unmounts or context changes
    return () => {
      clearTimeout(timeoutId);
      // Keep the existing subscription alive if unmounting
      // subscriptionCleanupRef.current will be cleaned up on next setup if needed
    };
  }, [contextType, contextId, user, editingMessageId]);
  
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