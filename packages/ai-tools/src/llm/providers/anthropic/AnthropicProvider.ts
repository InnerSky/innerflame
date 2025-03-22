import Anthropic from '@anthropic-ai/sdk';
import { 
  LLMProvider, 
  Message, 
  MessageRole, 
  RequestOptions, 
  LLMResponse,
  LLMApiError
} from '../../interfaces/LLMProvider.js';

// Define the MessageParam type based on Anthropic SDK requirements
interface AnthropicMessageParam {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Anthropic Provider implementation
 * Uses the official Anthropic SDK
 */
export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel: string;
  private defaultMaxTokens: number;
  
  constructor(apiKey: string, options?: { 
    defaultModel?: string;
    defaultMaxTokens?: number;
  }) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    this.client = new Anthropic({ apiKey });
    this.defaultModel = options?.defaultModel || 'claude-3-haiku-20240307';
    this.defaultMaxTokens = options?.defaultMaxTokens || 1024;
  }
  
  /**
   * Convert our Message format to Anthropic SDK format
   */
  private convertMessages(messages: Message[]): AnthropicMessageParam[] {
    return messages.filter(msg => 
      msg.role === MessageRole.USER || 
      msg.role === MessageRole.ASSISTANT
    ).map(msg => ({
      role: msg.role === MessageRole.USER ? 'user' : 'assistant',
      content: msg.content
    }));
  }
  
  /**
   * Send a message to Anthropic and get a complete response
   */
  async sendMessage(
    messages: Message[],
    options?: RequestOptions
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens || this.defaultMaxTokens,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt,
        messages: this.convertMessages(messages)
      });
      
      return {
        id: response.id,
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      };
    } catch (error: any) {
      // Convert Anthropic SDK errors to our common error format
      throw new LLMApiError(
        error.message || 'Unknown error during Anthropic API call',
        error.status || 500,
        error.type || 'api_error'
      );
    }
  }
  
  /**
   * Create a streaming message request to Anthropic
   */
  async streamMessage(
    messages: Message[],
    options?: RequestOptions
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const streamResponse = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens || this.defaultMaxTokens,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt,
        messages: this.convertMessages(messages),
        stream: true
      });
      
      // Create a readable stream from the SDK stream
      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            // Use the stream's async iterator
            for await (const event of streamResponse) {
              if (event.type === 'content_block_delta') {
                // Format the data as SSE (server-sent events)
                const text = JSON.stringify(event);
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(`data: ${text}\n\n`));
              }
            }
            
            // Close the stream when done
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
      
      return readable;
    } catch (error: any) {
      // Convert Anthropic SDK errors to our common error format
      throw new LLMApiError(
        error.message || 'Unknown error during Anthropic API streaming call',
        error.status || 500,
        error.type || 'api_error'
      );
    }
  }
}

/**
 * Create an Anthropic provider with the provided API key
 */
export function createAnthropicProvider(
  apiKey: string,
  options?: { 
    defaultModel?: string;
    defaultMaxTokens?: number;
  }
): AnthropicProvider {
  return new AnthropicProvider(apiKey, options);
} 