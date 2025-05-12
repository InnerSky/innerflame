import { 
  LLMProvider, 
  Message, 
  MessageRole, 
  RequestOptions, 
  LLMResponse,
  LLMApiError
} from '../../interfaces/LLMProvider.js';
import { AnthropicHandler } from '../../../api/providers/anthropic.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@innerflame/types';

/**
 * Create a Supabase client for logging
 */
function createSupabaseLogger(): SupabaseClient<Database> | null {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[API Logging] SUPABASE_URL or SUPABASE_KEY not defined, API logging will not work');
    return null;
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Log an API request to Supabase
 */
async function logApiRequest(
  supabase: SupabaseClient<Database> | null,
  provider: string, 
  endpoint: string, 
  request: any
): Promise<string | null> {
  if (!supabase) {
    console.warn('[API Logging] Supabase client not initialized, API logging will be skipped');
    return null;
  }
  
  try {
    console.log('[API Logging] Inserting log entry into api_logs table');
    const { data, error } = await supabase
      .from('api_logs')
      .insert({
        provider,
        endpoint,
        request,
        status: 'pending',
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('[API Logging] Error logging API request:', error);
      return null;
    }
    
    console.log(`[API Logging] Successfully logged API request with ID: ${data?.id}`);
    return data?.id || null;
  } catch (err) {
    console.error('[API Logging] Failed to log API request:', err);
    return null;
  }
}

/**
 * Extended usage metrics that include caching-related token counts
 */
export interface DetailedTokenUsage {
  /**
   * Number of tokens in the prompt/input
   */
  inputTokens: number;
  
  /**
   * Number of tokens in the response/output
   */
  outputTokens: number;
  
  /**
   * Number of tokens that were written to the cache
   * (only available when caching is enabled)
   */
  cacheWriteTokens?: number;
  
  /**
   * Number of tokens that were read from the cache
   * (only available when caching is enabled)
   */
  cacheReadTokens?: number;
}

/**
 * Extended request options specific to the Anthropic adapter
 */
export interface AnthropicRequestOptions extends RequestOptions {
  /**
   * Enable extended thinking mode for more detailed reasoning
   * Only works with Claude 3.7+ models
   */
  enableThinking?: boolean;
  
  /**
   * Token budget for extended thinking
   * Only applies if enableThinking is true
   * Default is 1000 tokens
   */
  thinkingBudget?: number;

  /**
   * Enable prompt caching for improved performance
   * This can significantly reduce latency and cost for similar prompts
   * Only available for Claude 3.5+ and 3.7+ models
   */
  enableCaching?: boolean;
}

/**
 * Extended response that includes reasoning and detailed usage metrics
 */
export interface AnthropicResponse extends LLMResponse {
  /**
   * Reasoning provided by Claude's extended thinking feature
   * Only populated if extended thinking was enabled
   */
  reasoning?: string;

  /**
   * Detailed token usage information
   * Includes caching metrics when caching is enabled
   */
  detailedUsage?: DetailedTokenUsage;
}

/**
 * Adapter for the Anthropic API that implements the LLMProvider interface
 * using the newer AnthropicHandler implementation
 */
export class AnthropicAdapter implements LLMProvider {
  private handler: AnthropicHandler;
  private defaultModel: string;
  private defaultThinkingBudget: number;
  private cachingEnabled: boolean;
  private supabase: SupabaseClient<Database> | null;
  // defaultMaxTokens is reserved for future use when the handler supports direct token limits
  
  constructor(apiKey: string, options?: { 
    defaultModel?: string;
    defaultMaxTokens?: number;
    defaultThinkingBudget?: number;
    enableCaching?: boolean;
  }) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    this.defaultModel = options?.defaultModel || 'claude-3-haiku-20240307';
    this.defaultThinkingBudget = options?.defaultThinkingBudget || 1000;
    this.cachingEnabled = options?.enableCaching ?? false;
    
    // Initialize Supabase client for logging
    console.log('[API Logging] Initializing Supabase client for API logging in AnthropicAdapter');
    this.supabase = createSupabaseLogger();
    
    // Create the handler with appropriate options
    this.handler = new AnthropicHandler({
      apiKey,
      apiModelId: this.defaultModel,
      // Set default thinking budget
      thinkingBudgetTokens: this.defaultThinkingBudget
    });
  }
  
  /**
   * Convert our Message format to Anthropic SDK format
   */
  private convertMessages(messages: Message[]): any[] {
    return messages.filter(msg => 
      msg.role === MessageRole.USER || 
      msg.role === MessageRole.ASSISTANT
    ).map(msg => ({
      role: msg.role === MessageRole.USER ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  /**
   * Check if a model supports the extended thinking feature
   * Currently only Claude 3.7+ models support this feature
   */
  private modelSupportsThinking(modelId: string): boolean {
    return modelId.includes('3-7') || modelId.includes('3.7');
  }

  /**
   * Check if a model supports the prompt caching feature
   * Claude 3.5+ and 3.7+ models support caching
   */
  private modelSupportsCaching(modelId: string): boolean {
    return modelId.includes('3-7') || modelId.includes('3.7') || 
           modelId.includes('3-5') || modelId.includes('3.5') ||
           modelId.includes('3-opus');
  }
  
  /**
   * Apply appropriate cache control markings for prompt elements
   * This is necessary to enable prompt caching
   */
  private markMessagesForCaching(messages: any[]): any[] {
    if (!this.cachingEnabled) {
      return messages;
    }

    // Find indices of user messages for cache control
    const userMsgIndices = messages.reduce(
      (acc, msg, index) => (msg.role === 'user' ? [...acc, index] : acc),
      [] as number[]
    );
    
    const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1;
    const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1;
    
    return messages.map((message, index) => {
      // Mark the last two user messages as ephemeral for caching
      if (index === lastUserMsgIndex || index === secondLastMsgUserIndex) {
        // If the message already has a content array (multiple parts), add cache_control to each
        if (Array.isArray(message.content)) {
          return {
            ...message,
            content: message.content.map((content: any, contentIndex: number) => 
              contentIndex === message.content.length - 1
                ? {
                    ...content,
                    cache_control: { type: 'ephemeral' }
                  }
                : content
            )
          };
        } 
        // Otherwise, convert the string content to a structured content with cache_control
        else if (typeof message.content === 'string') {
          return {
            ...message,
            content: [
              {
                type: 'text',
                text: message.content,
                cache_control: { type: 'ephemeral' }
              }
            ]
          };
        }
      }
      return message;
    });
  }
  
  /**
   * Send a message to Anthropic and get a complete response
   */
  async sendMessage(
    messages: Message[],
    options?: AnthropicRequestOptions
  ): Promise<AnthropicResponse> {
    try {
      const systemPrompt = options?.systemPrompt || '';
      const anthropicMessages = this.convertMessages(messages);
      
      // Get model information
      const model = this.handler.getModel();
      
      // Configure thinking/reasoning if requested and supported
      const enableThinking = options?.enableThinking || false;
      const thinkingBudget = options?.thinkingBudget || this.defaultThinkingBudget;
      
      // Configure caching if requested and supported
      const enableCaching = options?.enableCaching ?? this.cachingEnabled;
      const cachingSupported = this.modelSupportsCaching(model.id);
      
      // Create new handler with updated options
      this.handler = new AnthropicHandler({
        apiKey: this.handler['options'].apiKey,
        apiModelId: model.id,
        thinkingBudgetTokens: enableThinking && this.modelSupportsThinking(model.id) ? thinkingBudget : 0
      });
      
      // Apply cache control markings if caching is enabled and supported
      const processedMessages = enableCaching && cachingSupported 
        ? this.markMessagesForCaching(anthropicMessages)
        : anthropicMessages;
      
      // Log API request to Supabase
      console.log('[API Logging] Anthropic non-streaming API request detected');
      const requestData = {
        model: model.id,
        systemPrompt,
        messages: processedMessages,
        thinking: enableThinking,
        caching: enableCaching && cachingSupported
      };
      
      await logApiRequest(this.supabase, 'anthropic', 'sendMessage', requestData);
      
      // Process the full response
      let content = '';
      let reasoning = '';
      let detailedUsage: DetailedTokenUsage = {
        inputTokens: 0, 
        outputTokens: 0
      };
      
      // Collect all chunks from the generator
      for await (const chunk of this.handler.createMessage(systemPrompt, processedMessages)) {
        if (chunk.type === 'text') {
          content += chunk.text;
        } else if (chunk.type === 'reasoning') {
          reasoning += chunk.reasoning;
        } else if (chunk.type === 'usage') {
          detailedUsage.inputTokens += chunk.inputTokens || 0;
          detailedUsage.outputTokens += chunk.outputTokens || 0;
          
          // Capture cache-related metrics if available
          if (chunk.cacheWriteTokens !== undefined) {
            detailedUsage.cacheWriteTokens = (detailedUsage.cacheWriteTokens || 0) + chunk.cacheWriteTokens;
          }
          if (chunk.cacheReadTokens !== undefined) {
            detailedUsage.cacheReadTokens = (detailedUsage.cacheReadTokens || 0) + chunk.cacheReadTokens;
          }
        }
      }
      
      return {
        id: `gen_${Date.now()}`, // Generate an ID since handler doesn't provide one
        content,
        model: model.id,
        usage: {
          inputTokens: detailedUsage.inputTokens,
          outputTokens: detailedUsage.outputTokens
        },
        detailedUsage,
        reasoning: reasoning.length > 0 ? reasoning : undefined
      };
    } catch (error: any) {
      // Convert errors to our common error format
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
    options?: AnthropicRequestOptions
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const systemPrompt = options?.systemPrompt || '';
      const anthropicMessages = this.convertMessages(messages);
      
      // Get model information
      const model = this.handler.getModel();
      
      // Configure thinking/reasoning if requested and supported
      const enableThinking = options?.enableThinking || false;
      const thinkingBudget = options?.thinkingBudget || this.defaultThinkingBudget;
      
      // Configure caching if requested and supported
      const enableCaching = options?.enableCaching ?? this.cachingEnabled;
      const cachingSupported = this.modelSupportsCaching(model.id);
      
      // Create new handler with updated options
      this.handler = new AnthropicHandler({
        apiKey: this.handler['options'].apiKey,
        apiModelId: model.id,
        thinkingBudgetTokens: enableThinking && this.modelSupportsThinking(model.id) ? thinkingBudget : 0
      });
      
      // Apply cache control markings if caching is enabled and supported
      const processedMessages = enableCaching && cachingSupported 
        ? this.markMessagesForCaching(anthropicMessages)
        : anthropicMessages;
      
      // Log API request to Supabase
      console.log('[API Logging] Anthropic streaming API request detected');
      const requestData = {
        model: model.id,
        systemPrompt,
        messages: processedMessages,
        thinking: enableThinking,
        caching: enableCaching && cachingSupported,
        streaming: true
      };
      
      await logApiRequest(this.supabase, 'anthropic', 'streamMessage', requestData);
      
      // Create a readable stream from the generator
      const handler = this.handler; // Capture the handler reference
      
      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            const generator = handler.createMessage(systemPrompt, processedMessages);
            const encoder = new TextEncoder();
            const detailedUsage: DetailedTokenUsage = {
              inputTokens: 0,
              outputTokens: 0
            };
            
            for await (const chunk of generator) {
              if (chunk.type === 'text') {
                // Format the data as SSE (server-sent events)
                const textChunk = {
                  type: 'content_block_delta',
                  delta: {
                    type: 'text_delta',
                    text: chunk.text
                  }
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(textChunk)}\n\n`));
              } else if (chunk.type === 'reasoning' && enableThinking) {
                // Include reasoning chunks if thinking is enabled
                const reasoningChunk = {
                  type: 'thinking_block_delta',
                  delta: {
                    type: 'thinking_delta',
                    thinking: chunk.reasoning
                  }
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(reasoningChunk)}\n\n`));
              } else if (chunk.type === 'usage') {
                // Update token usage information
                detailedUsage.inputTokens += chunk.inputTokens || 0;
                detailedUsage.outputTokens += chunk.outputTokens || 0;
                
                // Capture cache-related metrics if available
                if (chunk.cacheWriteTokens !== undefined) {
                  detailedUsage.cacheWriteTokens = (detailedUsage.cacheWriteTokens || 0) + chunk.cacheWriteTokens;
                }
                if (chunk.cacheReadTokens !== undefined) {
                  detailedUsage.cacheReadTokens = (detailedUsage.cacheReadTokens || 0) + chunk.cacheReadTokens;
                }
                
                // Send usage data as an SSE event
                const usageChunk = {
                  type: 'usage_info',
                  usage: detailedUsage
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(usageChunk)}\n\n`));
              }
            }
            
            // Send final usage information
            const finalUsageChunk = {
              type: 'final_usage_info',
              usage: detailedUsage
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUsageChunk)}\n\n`));
            
            // Send a final done event
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            
            // Close the stream when done
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
      
      return readable;
    } catch (error: any) {
      // Convert errors to our common error format
      throw new LLMApiError(
        error.message || 'Unknown error during Anthropic API streaming call',
        error.status || 500,
        error.type || 'api_error'
      );
    }
  }

  /**
   * Get the currently configured model
   */
  getModel(): string {
    return this.handler.getModel().id;
  }

  /**
   * Set a new model to use for requests
   */
  setModel(modelId: string): void {
    // Create a new handler with the updated model
    this.handler = new AnthropicHandler({
      apiKey: this.handler['options'].apiKey,
      apiModelId: modelId,
      thinkingBudgetTokens: this.handler['options'].thinkingBudgetTokens || 0
    });
    this.defaultModel = modelId;
  }

  /**
   * Enable or disable prompt caching
   */
  setCaching(enabled: boolean): void {
    this.cachingEnabled = enabled;
  }

  /**
   * Check if caching is currently enabled
   */
  isCachingEnabled(): boolean {
    return this.cachingEnabled;
  }

  /**
   * Check if the current model supports caching
   */
  currentModelSupportsCaching(): boolean {
    return this.modelSupportsCaching(this.getModel());
  }
}

/**
 * Create an Anthropic adapter with the provided API key
 */
export function createAnthropicAdapter(
  apiKey: string,
  options?: { 
    defaultModel?: string;
    defaultMaxTokens?: number;
    defaultThinkingBudget?: number;
    enableCaching?: boolean;
  }
): AnthropicAdapter {
  return new AnthropicAdapter(apiKey, options);
} 