import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  Message, 
  MessageContextType, 
  MessageFilter, 
  CreateMessageParams,
  mapToMessage 
} from '@innerflame/types';

/**
 * Shared MessageService that can be used by both frontend and backend
 */
export class MessageService {
  private db: SupabaseClient;

  /**
   * Create a new MessageService instance with dependency injection
   * @param supabaseClient The Supabase client instance to use for database operations
   */
  constructor(supabaseClient: SupabaseClient) {
    this.db = supabaseClient;
  }

  /**
   * Factory method to create a new MessageService instance
   * @param supabaseClient The Supabase client instance to use
   * @returns A new MessageService instance
   */
  static initialize(supabaseClient: SupabaseClient): MessageService {
    return new MessageService(supabaseClient);
  }

  /**
   * Load messages based on provided filters
   */
  async loadMessages(filter: MessageFilter): Promise<Message[]> {
    let query = this.db
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (filter.contextType && filter.contextType !== MessageContextType.None) {
      query = query.eq('context_type', filter.contextType);
      
      if (filter.contextId) {
        query = query.eq('context_id', filter.contextId);
      }
    } else if (filter.contextType === MessageContextType.None) {
      query = query.is('context_type', null);
    }
    
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    
    if (filter.replyToMessageId) {
      query = query.eq('reply_to_message_id', filter.replyToMessageId);
    }
    
    // Apply limit if specified
    if (filter.limit && filter.limit > 0) {
      query = query.limit(filter.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error loading messages:', error);
      throw error;
    }
    
    // Map DB rows to domain models
    return (data || []).map(mapToMessage);
  }
  
  /**
   * Create a new message with context information
   */
  async createMessage(params: CreateMessageParams): Promise<Message> {
    const {
      content,
      userId,
      senderType,
      contextType,
      contextId,
      contextEntityVersionId,
      replyToMessageId
    } = params;
    
    // Prepare message data
    const messageData = {
      content,
      user_id: userId,
      sender_type: senderType,
      context_type: contextType !== MessageContextType.None ? contextType : null,
      context_id: contextId || null,
      context_entity_version_id: contextEntityVersionId || null,
      reply_to_message_id: replyToMessageId || null,
      created_at: new Date().toISOString()
    };
    
    // Insert the message
    const { data, error } = await this.db
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating message:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from message creation');
    }
    
    // Map DB row to domain model
    return mapToMessage(data);
  }
  
  /**
   * Get a message by ID
   */
  async getMessage(messageId: string): Promise<Message> {
    try {
      const { data, error } = await this.db
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
      
      if (error) {
        console.error('Error fetching message:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Message not found');
      }
      
      // Map DB row to domain model
      return mapToMessage(data);
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
      throw new Error(`Failed to fetch message: ${(error as Error).message}`);
    }
  }
  
  /**
   * Update an existing message
   *
   * @param messageId - The ID of the message to update
   * @param content - The new content for the message
   * @param userId - The ID of the user performing the update (for permission checking)
   * @returns The updated message
   */
  async updateMessage(
    messageId: string,
    content: string,
    userId: string
  ): Promise<Message> {
    try {
      // First check if the message exists and belongs to the user
      const { data: existingMessage, error: fetchError } = await this.db
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching message for update:', fetchError);
        throw fetchError;
      }
      
      if (!existingMessage) {
        throw new Error('Message not found');
      }
      
      // Check if the user owns this message
      if (existingMessage.user_id !== userId) {
        throw new Error('You can only edit your own messages');
      }
      
      // Update the message
      const { data, error } = await this.db
        .from('messages')
        .update({ content })
        .eq('id', messageId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating message:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data returned from message update');
      }
      
      // Map DB row to domain model
      return mapToMessage(data);
    } catch (error) {
      console.error(`Error updating message ${messageId}:`, error);
      throw new Error(`Failed to update message: ${(error as Error).message}`);
    }
  }
  
  /**
   * Delete a message
   *
   * @param messageId - The ID of the message to delete
   * @param userId - The ID of the user performing the deletion (for permission checking)
   * @returns A boolean indicating success
   */
  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // First check if the message exists and belongs to the user
      const { data: existingMessage, error: fetchError } = await this.db
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching message for deletion:', fetchError);
        throw fetchError;
      }
      
      if (!existingMessage) {
        throw new Error('Message not found');
      }
      
      // Check if the user owns this message
      if (existingMessage.user_id !== userId) {
        throw new Error('You can only delete your own messages');
      }
      
      // Delete the message
      const { error } = await this.db
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting message ${messageId}:`, error);
      throw new Error(`Failed to delete message: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get messages for a specific document
   */
  getDocumentMessages(documentId: string, limit?: number): Promise<Message[]> {
    return this.loadMessages({
      contextType: MessageContextType.Document,
      contextId: documentId,
      limit
    });
  }
  
  /**
   * Get messages for a specific project
   */
  getProjectMessages(projectId: string, limit?: number): Promise<Message[]> {
    return this.loadMessages({
      contextType: MessageContextType.Project,
      contextId: projectId,
      limit
    });
  }
  
  /**
   * Get general messages (without specific context)
   */
  getGeneralMessages(limit?: number): Promise<Message[]> {
    return this.loadMessages({
      contextType: MessageContextType.None,
      limit
    });
  }
  
  /**
   * Delete all messages associated with a specific context
   *
   * @param contextId - The ID of the context (document or project)
   * @param contextType - Optional context type. If not provided, deletes all messages with the given contextId
   * @returns Promise resolving to the number of deleted messages
   */
  async deleteMessagesByContext(
    contextId: string,
    contextType?: MessageContextType
  ): Promise<number> {
    try {
      let query = this.db
        .from('messages')
        .delete()
        .eq('context_id', contextId);
      
      // If context type is provided, use it as an additional filter
      if (contextType) {
        query = query.eq('context_type', contextType);
      }
      
      const { error, count } = await query;
      
      if (error) {
        console.error('Error deleting messages by context:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error(`Error deleting messages for context ${contextId}:`, error);
      throw new Error(`Failed to delete messages: ${(error as Error).message}`);
    }
  }
} 