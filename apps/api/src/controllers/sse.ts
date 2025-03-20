import { Response } from 'express';

/**
 * Server-Sent Events Controller for streaming responses
 */

/**
 * Initialize an SSE connection with the client
 */
export function initSSE(res: Response): Response {
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
  sendSSEEvent(res, 'error', { type: 'error', error });
}

/**
 * Send a completion message to the client
 */
export function sendComplete(res: Response, data: any = {}): void {
  sendSSEEvent(res, 'complete', { type: 'complete', ...data });
}

/**
 * Send a tool call event to the client
 */
export function sendToolCall(res: Response, toolName: string, args: any): void {
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