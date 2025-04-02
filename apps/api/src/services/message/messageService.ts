/**
 * Server-side Message Service for Supabase
 */
import { SupabaseService } from '../supabase/supabaseService.js';
import { MessageContextType, MessageSenderType } from '@innerflame/types';

interface CreateMessageParams {
  content: string;
  userId: string;
  senderType: MessageSenderType;
  contextType?: MessageContextType;
  contextId?: string;
  contextEntityVersionId?: string;
  replyToMessageId?: string;
}

export class MessageService {
  /**
   * Create a new message in Supabase
   */
  static async createMessage(params: CreateMessageParams) {
    const supabase = SupabaseService.getClient();
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const {
      content,
      userId,
      senderType,
      contextType,
      contextId,
      contextEntityVersionId,
      replyToMessageId
    } = params;
    
    // Validate context values
    if (!contextType && senderType === MessageSenderType.Assistant) {
      console.warn('Assistant message created without contextType');
    }
    
    if (!contextId && contextType && senderType === MessageSenderType.Assistant) {
      console.warn(`Assistant message created with contextType=${contextType} but missing contextId`);
    }
    
    // Prepare message data
    const messageData = {
      content,
      user_id: userId,
      sender_type: senderType,
      context_type: contextType || null,
      context_id: contextId || null,
      context_entity_version_id: contextEntityVersionId || null,
      reply_to_message_id: replyToMessageId || null,
      created_at: new Date().toISOString()
    };
    
    console.log(`Creating ${senderType} message with context_type=${contextType}, context_id=${contextId}, context_entity_version_id=${contextEntityVersionId}`);
    
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
    
    // Return the created message
    return data;
  }
} 