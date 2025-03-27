/**
 * SSE Client for streaming AI responses
 */

// Import Message type
import { Message } from '../models/message.js';

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
  documentEdit?: {
    processed: boolean;
    updated: boolean;
    versionNumber?: number;
    error?: string;
  };
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
  contextType: string;
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  projectId?: string;
  projectName?: string;
  chatHistory?: Message[]; // Add previous messages for context
  agentType?: string; // Add agentType option
  onChunk?: (chunk: string) => void;
  onTool?: (toolName: string, args: any) => void;
  onError?: (error: string) => void;
  onComplete?: (data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
}

// API base URL - defaults to localhost:3001 in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Create an SSE connection to stream AI responses
 */
export function createAIStream(options: StreamConfig): { close: () => void } {
  const {
    message,
    userId,
    contextType,
    documentId,
    documentTitle,
    documentContent,
    projectId,
    projectName,
    chatHistory,
    agentType,
    onConnectionChange,
    onError,
    onChunk,
    onTool,
    onComplete
  } = options;
  
  // Generate a unique session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Determine which endpoint to use based on agentType
  const endpoint = agentType === 'orchestrator' 
    ? '/api/ai/orchestrator' 
    : agentType 
      ? '/api/ai/agent' 
      : '/api/ai/stream';
  
  // Track the event source
  let eventSource: EventSource | null = null;
  
  // Construct full URL with API base URL
  const fullUrl = `${API_BASE_URL}${endpoint}?sessionId=${sessionId}`;
  console.log('Connecting to API endpoint:', fullUrl);
  
  // Initialize the stream by sending a POST request to create the session
  fetch(fullUrl, {
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
      chatHistory,
      agentType: agentType === 'orchestrator' ? undefined : agentType, // Don't pass orchestrator as agent type
    }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to initialize stream: ${response.status} ${response.statusText}`);
    }
    
    // For orchestrator endpoint, we don't need to connect to an EventSource
    // since it handles streaming directly in the POST request
    if (agentType === 'orchestrator') {
      console.log('Orchestrator endpoint initialized, streaming handled directly via POST');
      // Signal connection is active
      onConnectionChange?.(true);
      
      // Set up a reader for streaming the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        // Process the stream
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('Stream complete');
                onConnectionChange?.(false);
                onComplete?.({});
                break;
              }
              
              // Decode and process the chunk
              const chunk = decoder.decode(value, { stream: true });
              console.log('Received raw chunk:', chunk.substring(0, 50) + '...');
              
              // Process the raw SSE format
              // SSE format consists of "event: name" followed by "data: {json}" and ends with two newlines
              // We need to match content like "event: chunk\ndata: {"type":"chunk","content":"text"}\n\n"
              
              // Split by double newlines to get complete event+data pairs
              const eventPairs = chunk.split('\n\n').filter(pair => pair.trim());
              
              for (const pair of eventPairs) {
                // Extract event type
                const eventMatch = pair.match(/^event: (.+)$/m);
                const eventType = eventMatch ? eventMatch[1] : null;
                
                // Extract data payload
                const dataMatch = pair.match(/^data: (.+)$/m);
                const dataPayload = dataMatch ? dataMatch[1].trim() : null;
                
                if (eventType && dataPayload) {
                  console.log(`Received event: ${eventType}, data: ${dataPayload.substring(0, 20)}...`);
                  
                  try {
                    const data = JSON.parse(dataPayload);
                    
                    switch (eventType) {
                      case 'connected':
                        // Already handled via onConnectionChange
                        break;
                      
                      case 'chunk':
                        if (data.content) {
                          console.log('Processing content chunk:', data.content.substring(0, 20) + '...');
                          onChunk?.(data.content);
                        }
                        break;
                      
                      case 'tool':
                        console.log('Tool called:', data.tool);
                        onTool?.(data.tool, data.args);
                        break;
                      
                      case 'error':
                        console.error('Received error event:', data.error);
                        onError?.(data.error);
                        break;
                      
                      case 'complete':
                        console.log('Stream complete event received');
                        onComplete?.(data);
                        break;
                    }
                  } catch (error) {
                    console.error(`Error parsing data for event ${eventType}:`, error, dataPayload);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error reading stream:', error);
            onError?.(error instanceof Error ? error.message : 'Error reading stream');
            onConnectionChange?.(false);
          }
        };
        
        processStream();
      }
      
      return { success: true };
    }
    
    return response.json();
  })
  .then((data) => {
    // Only connect to EventSource for non-orchestrator endpoints after initial setup
    if (agentType !== 'orchestrator' && data.success) {
      // Connect to the EventSource now that the session is ready
      connectEventSource();
    }
  })
  .catch(error => {
    console.error('Error initializing stream:', error);
    if (onError) {
      onError(error.message);
    }
  });
  
  // Function to connect to the SSE endpoint
  function connectEventSource() {
    // Create the EventSource with the session ID - use the full URL
    eventSource = new EventSource(`${API_BASE_URL}${endpoint}?sessionId=${sessionId}`);
    console.log('EventSource connected to:', `${API_BASE_URL}${endpoint}?sessionId=${sessionId}`);
    
    // Set up event listeners
    eventSource.addEventListener('connected', (event: MessageEvent) => {
      console.log('Connected to event stream');
      onConnectionChange?.(true);
    });
    
    eventSource.addEventListener('chunk', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as TokenChunk;
        console.log('Received chunk:', data.content.substring(0, 20) + '...');
        onChunk?.(data.content);
      } catch (error) {
        console.error('Error parsing chunk:', error);
      }
    });
    
    eventSource.addEventListener('tool', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ToolCall;
        console.log('Tool called:', data.tool);
        onTool?.(data.tool, data.args);
      } catch (error) {
        console.error('Error parsing tool call:', error);
      }
    });
    
    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ErrorEvent;
        console.error('Received error event:', data.error);
        onError?.(data.error);
      } catch (error) {
        console.error('Error parsing error event:', error);
        onError?.('Unknown error occurred');
      }
      
      // Close the connection
      eventSource?.close();
      onConnectionChange?.(false);
    });
    
    eventSource.addEventListener('complete', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as CompleteEvent;
        console.log('Stream complete');
        onComplete?.(data);
      } catch (error) {
        console.error('Error parsing complete event:', error);
      }
      
      // Close the connection
      eventSource?.close();
      onConnectionChange?.(false);
    });
    
    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      onError?.('Connection error');
      onConnectionChange?.(false);
      eventSource?.close();
    };
  }
  
  // Return close function
  return {
    close: () => {
      if (eventSource) {
        console.log('Closing event source');
        eventSource.close();
        onConnectionChange?.(false);
      }
    }
  };
} 