/**
 * Ask user question tool for AI agents
 */
import type { Message } from '@innerflame/types/message.js';

interface AskUserQuestionParams {
  question: string;
  contextId: string;
  contextType: string;
  displayThreadId: string;
}

/**
 * Asks the user a question and waits for a response
 * This is a placeholder implementation that will be replaced with actual WebSocket functionality
 */
export async function askUserQuestion(
  params: AskUserQuestionParams,
  timeoutMs = 300000 // 5 minutes
): Promise<Message> {
  const { question, contextId, contextType, displayThreadId } = params;
  
  // In a real implementation, this would send a message to the user via WebSocket
  // and wait for a response using a promise that resolves when the user replies
  
  console.log(`AI wants to ask the user: ${question}`);
  
  // For now, we'll just simulate a response after a short delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'simulated-response-id',
        userId: 'user-id',
        senderType: 'user',
        content: 'This is a simulated response from the user.',
        contextType,
        contextId,
        hasProposedChanges: false,
        displayThreadId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }, 1000);
  });
} 