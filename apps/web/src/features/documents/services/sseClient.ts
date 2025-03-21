/**
 * SSE Client for streaming AI responses
 */

// Types for messages
type TokenChunk = {
  type: 'chunk';
  content: string;
};

type ToolCall = {
  type: 'tool';
  tool: string;
  args: Record<string, any>;
};

type ErrorEvent = {
  type: 'error';
  error: string;
};

type CompleteEvent = {
  type: 'complete';
  fullResponse?: string;
  toolName?: string;
  result?: any;
  messageId?: string;
  messageError?: string;
};

// Event callback types
type ChunkCallback = (chunk: string) => void;
type ToolCallback = (tool: string, args: Record<string, any>) => void;
type ErrorCallback = (error: string) => void;
type CompleteCallback = (data: CompleteEvent) => void;
type ConnectionCallback = (connected: boolean) => void;

// Configuration for SSE stream
interface StreamConfig {
  message: string;
  userId: string;
  contextType: 'document' | 'project' | 'general';
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  projectId?: string;
  projectName?: string;
  onChunk?: ChunkCallback;
  onTool?: ToolCallback;
  onError?: ErrorCallback;
  onComplete?: CompleteCallback;
  onConnectionChange?: ConnectionCallback;
}

// API base URL - defaults to localhost:3001 in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Create an SSE connection to stream AI responses
 */
export function createAIStream(config: StreamConfig): { close: () => void } {
  const {
    message,
    userId,
    contextType,
    documentId,
    documentTitle,
    documentContent,
    projectId,
    projectName,
    onChunk,
    onTool,
    onError,
    onComplete,
    onConnectionChange
  } = config;
  
  // Create a unique session ID for this stream
  const sessionId = Date.now().toString();
  const streamUrl = `${API_BASE_URL}/api/ai/stream?sessionId=${sessionId}`;
  
  // First, create the request to start streaming
  fetch(streamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      userId,
      contextType,
      documentId,
      documentTitle,
      documentContent,
      projectId,
      projectName,
      sessionId
    })
  }).catch(error => {
    console.error('Failed to initialize stream:', error);
    onError?.(error.message || 'Failed to connect to stream');
  });
  
  // Now set up the event source to the same URL
  const eventSource = new EventSource(streamUrl);
  
  // Set up event listeners
  eventSource.addEventListener('connected', (event: MessageEvent) => {
    onConnectionChange?.(true);
  });
  
  eventSource.addEventListener('chunk', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as TokenChunk;
      onChunk?.(data.content);
    } catch (error) {
      console.error('Error parsing chunk:', error);
    }
  });
  
  eventSource.addEventListener('tool', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as ToolCall;
      onTool?.(data.tool, data.args);
    } catch (error) {
      console.error('Error parsing tool call:', error);
    }
  });
  
  eventSource.addEventListener('error', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as ErrorEvent;
      onError?.(data.error);
    } catch (error) {
      console.error('Error parsing error event:', error);
      onError?.('Unknown error occurred');
    }
    
    // Close the connection
    eventSource.close();
    onConnectionChange?.(false);
  });
  
  eventSource.addEventListener('complete', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as CompleteEvent;
      onComplete?.(data);
    } catch (error) {
      console.error('Error parsing complete event:', error);
    }
    
    // Close the connection
    eventSource.close();
    onConnectionChange?.(false);
  });
  
  // Handle connection errors
  eventSource.onerror = () => {
    console.error('SSE connection error');
    onError?.('Connection error');
    onConnectionChange?.(false);
    eventSource.close();
  };
  
  // Return a function to close the connection
  return {
    close: () => {
      eventSource.close();
      onConnectionChange?.(false);
    }
  };
} 