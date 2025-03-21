/**
 * Server-side Message Service for Supabase
 */
import { SupabaseService } from '../supabase/supabaseService.js';

interface CreateMessageParams {
  content: string;
  userId: string;
  senderType: 'user' | 'assistant';
  contextType?: string;
  contextId?: string;
  replyToMessageId?: string;
  displayThreadId?: string;
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
      replyToMessageId,
      displayThreadId
    } = params;
    
    // Validate context values
    if (!contextType && senderType === 'assistant') {
      console.warn('Assistant message created without contextType');
    }
    
    if (!contextId && contextType && senderType === 'assistant') {
      console.warn(`Assistant message created with contextType=${contextType} but missing contextId`);
    }
    
    // Prepare message data
    const messageData = {
      content,
      user_id: userId,
      sender_type: senderType,
      context_type: contextType || null,
      context_id: contextId || null,
      reply_to_message_id: replyToMessageId || null,
      display_thread_id: displayThreadId || null,
      created_at: new Date().toISOString(),
      has_proposed_changes: false
    };
    
    console.log(`Creating ${senderType} message with context_type=${contextType}, context_id=${contextId}`);
    
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