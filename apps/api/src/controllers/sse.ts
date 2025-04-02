import { Response, Request } from 'express';
import { MessageService } from '../services/message/messageService.js';
import { processDocumentEdit } from '../handlers/documentEditHandler.js';
import { MessageSenderType, MessageContextType } from '@innerflame/types';

/**
 * Server-Sent Events Controller for streaming responses
 */

/**
 * Initialize an SSE connection with the client
 */
export function initSSE(res: Response): Response {
  console.log('Initializing SSE connection with client');
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx proxies
  
  // Initial connection message
  res.write('event: connected\n');
  res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);
  
  // Enable Node.js to keep the connection alive
  res.flushHeaders();
  
  return res;
}

/**
 * Send an SSE event to the client
 */
export function sendSSEEvent(res: Response, event: string, data: any): void {
  if (!res || res.writableEnded) {
    console.warn('Attempted to write to a closed or invalid response');
    return;
  }
  
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    console.error('Error sending SSE event:', error);
  }
}

/**
 * Send a token chunk to the client
 */
export function sendTokenChunk(res: Response, content: string): void {
  sendSSEEvent(res, 'chunk', { type: 'chunk', content });
}

/**
 * Send an error message to the client
 */
export function sendError(res: Response, error: string): void {
  console.error(`Sending error to client: ${error}`);
  sendSSEEvent(res, 'error', { type: 'error', error });
}

/**
 * Send a completion message to the client after saving the message to the database
 */
export async function sendComplete(req: Request, res: Response, data: any = {}): Promise<void> {
  console.log('Sending completion to client');
  
  try {
    // Extract the necessary context information from the request
    const { userId, contextType, contextId, contextEntityVersionId } = req.body;
    const fullResponse = data.fullResponse || '';
    
    let savedMessage = null;
    let error = null;
    
    // Process document edit if present
    let documentEditResult = null;
    if (contextType === MessageContextType.Document && fullResponse) {
      documentEditResult = await processDocumentEdit(req, fullResponse);
    }
    
    // Save message to Supabase if we have a user ID and content
    if (userId && fullResponse) {
      try {
        // Determine the appropriate context entity version ID
        // If document was updated, use the new version ID from the edit result
        let messageContextEntityVersionId = contextEntityVersionId;
        
        if (documentEditResult?.documentUpdated) {
          if (documentEditResult.versionId) {
            // Use the new version ID if available
            messageContextEntityVersionId = documentEditResult.versionId;
            console.log(`Using new document version ID: ${messageContextEntityVersionId} (version number: ${documentEditResult.versionNumber})`);
          } else if (documentEditResult.versionNumber) {
            // If only version number is available (backward compatibility)
            console.log(`Document was updated to version number: ${documentEditResult.versionNumber}, but no version ID was provided`);
            
            if (contextEntityVersionId) {
              console.log(`Falling back to original contextEntityVersionId: ${contextEntityVersionId}`);
            } else {
              console.log(`No contextEntityVersionId available despite document update`);
            }
          }
        }
        
        // Create the assistant message with the exact same context as the user message
        savedMessage = await MessageService.createMessage({
          content: fullResponse,
          userId,
          senderType: MessageSenderType.Assistant,
          contextType: contextType as MessageContextType, // Type cast to ensure proper type
          contextId: contextId,
          contextEntityVersionId: messageContextEntityVersionId
        });
        
        console.log(`Saved assistant message with contextType=${contextType}, contextId=${contextId}, contextEntityVersionId=${messageContextEntityVersionId}`);
      } catch (err) {
        error = err instanceof Error ? err.message : 'Error saving message';
        console.error('Error saving assistant message:', err);
      }
    }
    
    // Send the complete event with the saved message ID if available
    sendSSEEvent(res, 'complete', { 
      type: 'complete', 
      ...data,
      messageId: savedMessage?.id,
      messageError: error,
      documentEdit: documentEditResult ? {
        processed: documentEditResult.processed,
        updated: documentEditResult.documentUpdated,
        versionNumber: documentEditResult.versionNumber,
        versionId: documentEditResult.versionId,
        error: documentEditResult.error
      } : null
    });
  } catch (err) {
    console.error('Error in sendComplete:', err);
    // Fallback to just sending the completion without the message ID
    sendSSEEvent(res, 'complete', { type: 'complete', ...data });
  }
}

/**
 * Send a tool call event to the client
 */
export function sendToolCall(res: Response, toolName: string, args: any): void {
  console.log(`Sending tool call: ${toolName}`);
  sendSSEEvent(res, 'tool', { 
    type: 'tool', 
    tool: toolName,
    args
  });
}

/**
 * End the SSE connection
 */
export function endSSE(res: Response): void {
  if (res && !res.writableEnded) {
    res.end();
  }
} 