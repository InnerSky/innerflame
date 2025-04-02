import { supabase } from '@/lib/supabase.js';
import { 
  Message, 
  MessageContextType, 
  MessageFilter, 
  CreateMessageParams
} from '@innerflame/types';
import { MessageService as SharedMessageService } from '@innerflame/services';

// Create a singleton instance of the shared service
const sharedService = new SharedMessageService(supabase);

/**
 * Frontend MessageService facade that uses the shared MessageService
 */
export class MessageService {
  /**
   * Load messages based on provided filters
   */
  static async loadMessages(filter: MessageFilter): Promise<Message[]> {
    return sharedService.loadMessages(filter);
  }
  
  /**
   * Create a new message with context information
   */
  static async createMessage(params: CreateMessageParams): Promise<Message> {
    return sharedService.createMessage(params);
  }
  
  /**
   * Get a message by ID
   */
  static async getMessage(messageId: string): Promise<Message> {
    return sharedService.getMessage(messageId);
  }
  
  /**
   * Update an existing message
   * 
   * @param messageId - The ID of the message to update
   * @param content - The new content for the message
   * @param userId - The ID of the user performing the update (for permission checking)
   * @returns The updated message
   */
  static async updateMessage(
    messageId: string,
    content: string,
    userId: string
  ): Promise<Message> {
    return sharedService.updateMessage(messageId, content, userId);
  }
  
  /**
   * Delete a message
   * 
   * @param messageId - The ID of the message to delete
   * @param userId - The ID of the user performing the deletion (for permission checking)
   * @returns A boolean indicating success
   */
  static async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<boolean> {
    return sharedService.deleteMessage(messageId, userId);
  }
  
  /**
   * Get messages for a specific document
   */
  static getDocumentMessages(documentId: string, limit = 50): Promise<Message[]> {
    return sharedService.getDocumentMessages(documentId, limit);
  }
  
  /**
   * Get messages for a specific project
   */
  static getProjectMessages(projectId: string, limit = 50): Promise<Message[]> {
    return sharedService.getProjectMessages(projectId, limit);
  }
  
  /**
   * Get general messages (without specific context)
   */
  static getGeneralMessages(limit = 50): Promise<Message[]> {
    return sharedService.getGeneralMessages(limit);
  }
  
  /**
   * Delete all messages associated with a specific context
   *
   * @param contextId - The ID of the context (document or project)
   * @param contextType - Optional context type. If not provided, deletes all messages with the given contextId
   * @returns Promise resolving to the number of deleted messages
   */
  static async deleteMessagesByContext(
    contextId: string,
    contextType?: MessageContextType
  ): Promise<number> {
    return sharedService.deleteMessagesByContext(contextId, contextType);
  }
} 