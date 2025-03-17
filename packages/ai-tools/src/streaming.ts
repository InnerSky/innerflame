/**
 * AI streaming utilities
 */

/**
 * Creates an SSE stream for AI responses
 */
export function createAIStream(streamUrl: string): EventSource {
  const eventSource = new EventSource(streamUrl);
  
  return eventSource;
}

/**
 * Handles an AI stream event
 */
export function handleStreamEvent(
  event: MessageEvent,
  onChunk: (chunk: string) => void,
  onComplete?: () => void
): void {
  try {
    const data = JSON.parse(event.data);
    
    if (data.type === 'chunk') {
      onChunk(data.content);
    } else if (data.type === 'complete') {
      onComplete?.();
    }
  } catch (error) {
    console.error('Error parsing stream event:', error);
  }
} 