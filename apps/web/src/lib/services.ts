import { supabase } from './supabase.js';
import { MessageService } from '@innerflame/services';
import { MessageContextType } from '@innerflame/types';

// Create singleton instances of services
export const messageService = new MessageService(supabase);

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
  deleteMessagesByContext: (contextId: string, contextType?: MessageContextType) => 
    messageService.deleteMessagesByContext(contextId, contextType)
}; 