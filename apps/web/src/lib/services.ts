import { supabase } from './supabase.js';
import { MessageService } from '@innerflame/services';
import { MessageContextType, Message, mapToMessage } from '@innerflame/types';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Document } from '@/features/documents/models/document.js';
import { documentRepository } from '@/features/documents/repositories/documentRepository.js';

// Type for a database message row
interface MessageRow {
  id: string;
  content: string;
  content_embedding: string | null;
  context_entity_version_id: string | null;
  context_id: string | null;
  context_type: string | null;
  created_at: string | null;
  inhistory_id: string | null;
  reply_to_message_id: string | null;
  sender_type: string;
  user_id: string;
}

// Create singleton instances of services
export const messageService = new MessageService(supabase);

// Event handlers for real-time messages
type MessageEventHandler = (message: Message) => void;

// Message Subscription Service for real-time updates
export class MessageSubscriptionService {
  private subscriptions: { [key: string]: () => void } = {};
  private handlers: {
    insert: MessageEventHandler[];
    update: MessageEventHandler[];
    delete: MessageEventHandler[];
  } = {
    insert: [],
    update: [],
    delete: []
  };
  private debug: boolean = false; // Set to false to disable logging
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  /**
   * Subscribe to message changes in a specific context
   */
  subscribeToMessages(contextType?: MessageContextType, contextId?: string | null): () => void {
    // Generate a unique subscription ID
    const subscriptionId = `messages:${contextType || 'all'}:${contextId || 'all'}`;
    
    // Check if already subscribed
    if (this.subscriptions[subscriptionId]) {
      this.log('Already subscribed to', subscriptionId);
      return this.subscriptions[subscriptionId];
    }
    
    this.log('Subscribing to', subscriptionId);
    
    try {
      // Use channel-based approach which is more reliable
      const channel = supabase.channel(subscriptionId);
      
      const subscription = channel
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload: RealtimePostgresChangesPayload<MessageRow>) => {
            try {
              if (!payload.new) {
                this.logError('INSERT event missing payload.new data');
                return;
              }
              
              // Use type assertion to handle payload.new correctly
              const message = mapToMessage(payload.new as MessageRow);
              
              // Apply context filtering
              if (this.shouldFilterMessage(message, contextType, contextId)) {
                return;
              }
              
              this.log('INSERT event received:', message.id);
              this.handlers.insert.forEach(handler => handler(message));
            } catch (error) {
              this.logError('Error processing INSERT event:', error);
            }
          }
        )
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload: RealtimePostgresChangesPayload<MessageRow>) => {
            try {
              if (!payload.new) {
                this.logError('UPDATE event missing payload.new data');
                return;
              }
              
              // Use type assertion to handle payload.new correctly
              const message = mapToMessage(payload.new as MessageRow);
              
              // Apply context filtering
              if (this.shouldFilterMessage(message, contextType, contextId)) {
                return;
              }
              
              this.log('UPDATE event received:', message.id);
              this.handlers.update.forEach(handler => handler(message));
            } catch (error) {
              this.logError('Error processing UPDATE event:', error);
            }
          }
        )
        .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'messages' },
          (payload: RealtimePostgresChangesPayload<MessageRow>) => {
            try {
              // For DELETE, the data is in payload.old
              if (!payload.old) {
                this.logError('DELETE event missing payload.old data');
                return;
              }
              
              // For DELETE events, we only get the ID in payload.old, not the full record
              // This means we can't properly filter by context, so we need a different approach
              const messageId = payload.old && typeof payload.old === 'object' ? 
                (payload.old as any).id : undefined;
                
              if (!messageId) {
                this.logError('DELETE event missing message ID');
                return;
              }
              
              // Create a minimal message object with the ID
              // We skip context filtering for DELETE events since we don't have that data
              const deletedMessage: Message = {
                id: messageId,
                content: '',
                user_id: '',
                sender_type: 'user', // Default value, doesn't matter for deletion
                context_type: null,
                context_id: null,
                context_entity_version_id: null,
                reply_to_message_id: null,
                inhistory_id: null,
                createdAt: new Date(),
                isEdited: false
              };
              
              this.log('DELETE event received:', messageId);
              this.handlers.delete.forEach(handler => handler(deletedMessage));
            } catch (error) {
              this.logError('Error processing DELETE event:', error);
            }
          }
        )
        .subscribe((status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.logError('Subscription error with status:', status);
            
            // Implement retry logic
            setTimeout(() => {
              this.log(`Retrying subscription to ${subscriptionId}...`);
              // If subscription failed, clean it up first
              delete this.subscriptions[subscriptionId];
              // Then try to resubscribe
              this.subscribeToMessages(contextType, contextId);
            }, this.retryDelay);
            
            return;
          } else if (status === 'CLOSED') {
            // For CLOSED status, just log it without the error label if debug is enabled
            this.log(`Subscription closed for ${subscriptionId}`);
            return;
          }
          
          this.log(`Subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            this.log('Successfully subscribed to', subscriptionId);
          }
        });
      
      // Store the unsubscribe function
      const unsubscribe = () => {
        try {
          supabase.removeChannel(channel);
          delete this.subscriptions[subscriptionId];
          this.log('Unsubscribed from', subscriptionId);
        } catch (error) {
          this.logError('Error unsubscribing from', subscriptionId, error);
        }
      };
      
      this.subscriptions[subscriptionId] = unsubscribe;
      return unsubscribe;
    } catch (error) {
      this.logError('Error creating subscription:', error);
      return () => {}; // Return a no-op function
    }
  }
  
  /**
   * Check if a message should be filtered out based on context
   */
  private shouldFilterMessage(
    message: Message, 
    contextType?: MessageContextType, 
    contextId?: string | null
  ): boolean {
    // If contextType is 'None', it means we want all messages for the user,
    // regardless of their specific context. So, no filtering should occur.
    if (contextType === MessageContextType.None) {
      return false; // Do not filter, allow the message through
    }
    
    // Original logic for specific contexts (when contextType is not 'None'):
    if (contextType && contextId) {
      // Filter if the message's context_type or context_id doesn't match
      return message.context_type !== contextType || message.context_id !== contextId;
    } else if (contextType) {
      // If only contextType is provided (and it's not 'None'), 
      // filter if the message's context_type doesn't match.
      // This case might imply "all messages of a certain type, across all context IDs of that type".
      return message.context_type !== contextType;
    }
    
    // Default to not filtering if no specific context criteria are met
    // (e.g., if contextType was undefined but not MessageContextType.None, though current usage doesn't lead here)
    return false;
  }
  
  /**
   * Debug logging
   */
  private log(...args: any[]) {
    if (this.debug) {
      console.log('[MessageSubscription]', ...args);
    }
  }
  
  /**
   * Error logging
   */
  private logError(...args: any[]) {
    console.error('[MessageSubscription]', ...args);
  }
  
  /**
   * Add event handler for message inserts
   */
  onMessageInserted(handler: MessageEventHandler): () => void {
    this.handlers.insert.push(handler);
    return () => {
      this.handlers.insert = this.handlers.insert.filter(h => h !== handler);
    };
  }
  
  /**
   * Add event handler for message updates
   */
  onMessageUpdated(handler: MessageEventHandler): () => void {
    this.handlers.update.push(handler);
    return () => {
      this.handlers.update = this.handlers.update.filter(h => h !== handler);
    };
  }
  
  /**
   * Add event handler for message deletions
   */
  onMessageDeleted(handler: MessageEventHandler): () => void {
    this.handlers.delete.push(handler);
    return () => {
      this.handlers.delete = this.handlers.delete.filter(h => h !== handler);
    };
  }
  
  /**
   * Unsubscribe from all message events
   */
  unsubscribeAll() {
    Object.values(this.subscriptions).forEach(unsubscribe => unsubscribe());
    this.subscriptions = {};
    this.handlers.insert = [];
    this.handlers.update = [];
    this.handlers.delete = [];
  }
}

// Create a singleton instance
export const messageSubscriptionService = new MessageSubscriptionService();

// Document Subscription Service for real-time updates to document versions

// Type for document update event handler
type DocumentUpdateHandler = (document: Document) => void;

// Document Subscription Service for real-time updates
export class DocumentSubscriptionService {
  private subscriptions: { [key: string]: () => void } = {};
  private handlers: DocumentUpdateHandler[] = [];
  private debug: boolean = false; // Set to false to disable logging
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  /**
   * Subscribe to document entity_versions changes for a specific document
   */
  subscribeToDocument(documentId: string): () => void {
    // Generate a unique subscription ID
    const subscriptionId = `document:${documentId}`;
    
    // Check if already subscribed
    if (this.subscriptions[subscriptionId]) {
      this.log('Already subscribed to', subscriptionId);
      return this.subscriptions[subscriptionId];
    }
    
    this.log('Subscribing to', subscriptionId);
    
    try {
      // Use channel-based approach for reliability
      const channel = supabase.channel(subscriptionId);
      
      const subscription = channel
        // Listen for new versions being inserted
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'entity_versions',
            filter: `entity_id=eq.${documentId}` 
          },
          async (payload) => {
            try {
              if (!payload.new) {
                this.logError('INSERT event missing payload.new data');
                return;
              }
              
              // Check if this is a new current version
              if (!(payload.new as any).is_current) {
                return;
              }
              
              this.log('New document version INSERT event received for document:', documentId);
              
              // Fetch the complete updated document
              await this.fetchAndNotifyDocumentUpdate(documentId);
            } catch (error) {
              this.logError('Error processing document INSERT event:', error);
            }
          }
        )
        // Listen for updates to existing versions
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'entity_versions',
            filter: `entity_id=eq.${documentId}` 
          },
          async (payload) => {
            try {
              if (!payload.new) {
                this.logError('UPDATE event missing payload.new data');
                return;
              }
              
              // Check if this is the current version being updated
              if (!(payload.new as any).is_current) {
                // For non-current versions, we only care if it was just marked as current
                // by comparing old vs new is_current values
                const wasPreviouslyNotCurrent = payload.old && !(payload.old as any).is_current;
                const isNowCurrent = (payload.new as any).is_current;
                
                if (!(wasPreviouslyNotCurrent && isNowCurrent)) {
                  return;
                }
              }
              
              this.log('Document version UPDATE event received for document:', documentId);
              
              // Fetch the complete updated document
              await this.fetchAndNotifyDocumentUpdate(documentId);
            } catch (error) {
              this.logError('Error processing document UPDATE event:', error);
            }
          }
        )
        // Listen for updates to the entity's active_version_id
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'entities',
            filter: `id=eq.${documentId}` 
          },
          async (payload) => {
            try {
              if (!payload.new) {
                this.logError('Entity UPDATE event missing payload.new data');
                return;
              }
              
              const oldVersionId = payload.old ? (payload.old as any).active_version_id : null;
              const newVersionId = (payload.new as any).active_version_id;
              
              // Only process if active_version_id changed
              if (oldVersionId === newVersionId) {
                return;
              }
              
              this.log('Entity active_version_id UPDATE event received for document:', documentId);
              
              // Fetch the complete updated document
              await this.fetchAndNotifyDocumentUpdate(documentId);
            } catch (error) {
              this.logError('Error processing entity UPDATE event:', error);
            }
          }
        )
        .subscribe((status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.logError('Document subscription error with status:', status);
            
            // Implement retry logic
            setTimeout(() => {
              this.log(`Retrying subscription to ${subscriptionId}...`);
              // If subscription failed, clean it up first
              delete this.subscriptions[subscriptionId];
              // Then try to resubscribe
              this.subscribeToDocument(documentId);
            }, this.retryDelay);
            
            return;
          } else if (status === 'CLOSED') {
            // For CLOSED status, just log it without the error label if debug is enabled
            this.log(`Document subscription closed for ${subscriptionId}`);
            return;
          }
          
          this.log(`Document subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            this.log('Successfully subscribed to document updates:', subscriptionId);
          }
        });
      
      // Store the unsubscribe function
      const unsubscribe = () => {
        try {
          supabase.removeChannel(channel);
          delete this.subscriptions[subscriptionId];
          this.log('Unsubscribed from', subscriptionId);
        } catch (error) {
          this.logError('Error unsubscribing from', subscriptionId, error);
        }
      };
      
      this.subscriptions[subscriptionId] = unsubscribe;
      return unsubscribe;
    } catch (error) {
      this.logError('Error creating document subscription:', error);
      return () => {}; // Return a no-op function
    }
  }
  
  /**
   * Helper method to fetch the latest document and notify handlers
   */
  private async fetchAndNotifyDocumentUpdate(documentId: string): Promise<void> {
    try {
      const updatedDocument = await documentRepository.getDocumentWithVersions(documentId);
      if (updatedDocument) {
        // Notify all handlers about the update
        this.handlers.forEach(handler => handler(updatedDocument));
      } else {
        this.logError('Failed to fetch updated document after version change:', documentId);
      }
    } catch (fetchError) {
      this.logError('Error fetching updated document:', fetchError);
    }
  }
  
  /**
   * Add event handler for document updates
   */
  onDocumentUpdated(handler: DocumentUpdateHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Debug logging
   */
  private log(...args: any[]) {
    if (this.debug) {
      console.log('[DocumentSubscription]', ...args);
    }
  }
  
  /**
   * Error logging
   */
  private logError(...args: any[]) {
    console.error('[DocumentSubscription]', ...args);
  }
  
  /**
   * Unsubscribe from all document events
   */
  unsubscribeAll() {
    Object.values(this.subscriptions).forEach(unsubscribe => unsubscribe());
    this.subscriptions = {};
    this.handlers = [];
  }
}

// Create a singleton instance
export const documentSubscriptionService = new DocumentSubscriptionService();

// Re-export static versions for backward compatibility
export const MessageServiceStatic = {
  loadMessages: (filter: any) => messageService.loadMessages(filter),
  createMessage: (params: any) => messageService.createMessage(params),
  getMessage: (messageId: string) => messageService.getMessage(messageId),
  updateMessage: (messageId: string, content: string, userId: string) => 
    messageService.updateMessage(messageId, content, userId),
  deleteMessage: (messageId: string, userId: string) => 
    messageService.deleteMessage(messageId, userId),
  getDocumentMessages: (documentId: string, limit = 50) => 
    messageService.loadMessages({
      contextType: MessageContextType.Document,
      contextId: documentId,
      limit
    }),
  getProjectMessages: (projectId: string, limit = 50) => 
    messageService.loadMessages({
      contextType: MessageContextType.Project,
      contextId: projectId,
      limit
    }),
  getGeneralMessages: (limit = 50) => 
    messageService.loadMessages({
      contextType: MessageContextType.None,
      limit
    }),
  getAllUserMessages: (limit = 100) => 
    messageService.loadMessages({
      limit
    }),
  deleteMessagesByContext: (contextId: string, contextType?: MessageContextType) => 
    messageService.deleteMessagesByContext(contextId, contextType)
}; 