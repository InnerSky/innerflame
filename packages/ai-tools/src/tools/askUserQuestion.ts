/**
 * Ask user question tool for AI agents
 */
import type { Message, MessageContextType } from '@innerflame/types';

interface AskUserQuestionParams {
  question: string;
  contextId: string;
  contextType: MessageContextType;
}

/**
 * Asks the user a question and waits for a response
 * This is a placeholder implementation that will be replaced with actual WebSocket functionality
 */
export async function askUserQuestion(
  params: AskUserQuestionParams
): Promise<Message> {
  const { question, contextId, contextType } = params;
  
  // In a real implementation, this would send a message to the user via WebSocket
  // and wait for a response using a promise that resolves when the user replies
  
  console.log(`AI wants to ask the user: ${question}`);
  
  // For now, we'll just simulate a response after a short delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a simulated response with all required Message properties
      const simulatedResponse: Message = {
        id: 'simulated-response-id',
        user_id: 'user-id',
        sender_type: 'user',
        content: 'This is a simulated response from the user.',
        context_type: contextType,
        context_id: contextId,
        context_entity_version_id: null,
        contentEmbedding: undefined,
        reply_to_message_id: null,
        createdAt: new Date(),
        isEdited: false
      };
      
      resolve(simulatedResponse);
    }, 1000);
  });
} 