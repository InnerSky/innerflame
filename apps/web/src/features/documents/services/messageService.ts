import { supabase } from '@/lib/supabase.js';
import { 
  Message, 
  MessageContextType, 
  MessageFilter, 
  CreateMessageParams, 
  mapToMessage 
} from '../models/message.js';

export class MessageService {
  /**
   * Load messages based on provided filters
   */
  static async loadMessages(filter: MessageFilter): Promise<Message[]> {
    let query = supabase
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
    
    if (filter.threadId) {
      query = query.eq('display_thread_id', filter.threadId);
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
  static async createMessage(params: CreateMessageParams): Promise<Message> {
    const {
      content,
      userId,
      senderType,
      contextType,
      contextId,
      replyToMessageId,
      displayThreadId
    } = params;
    
    // Prepare message data
    const messageData = {
      content,
      user_id: userId,
      sender_type: senderType,
      context_type: contextType !== MessageContextType.None ? contextType : null,
      context_id: contextId || null,
      reply_to_message_id: replyToMessageId || null,
      display_thread_id: displayThreadId || null,
      created_at: new Date().toISOString()
    };
    
    // Insert the message
    const { data, error } = await supabase
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
   * Get messages for a specific document
   */
  static getDocumentMessages(documentId: string, limit = 50): Promise<Message[]> {
    return this.loadMessages({
      contextType: MessageContextType.Document,
      contextId: documentId,
      limit
    });
  }
  
  /**
   * Get messages for a specific project
   */
  static getProjectMessages(projectId: string, limit = 50): Promise<Message[]> {
    return this.loadMessages({
      contextType: MessageContextType.Project,
      contextId: projectId,
      limit
    });
  }
  
  /**
   * Get general messages (without specific context)
   */
  static getGeneralMessages(limit = 50): Promise<Message[]> {
    return this.loadMessages({
      contextType: MessageContextType.None,
      limit
    });
  }
} 