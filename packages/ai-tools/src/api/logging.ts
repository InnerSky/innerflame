import { Anthropic } from "@anthropic-ai/sdk";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApiHandler } from "./index.js";
import { ApiStream } from "./transform/stream.js";
import { ModelInfo } from "../shared/api.js";
import type { Database } from '@innerflame/types';

/**
 * Create a Supabase client for logging
 */
function createSupabaseLogger(): SupabaseClient<Database> | null {
  console.log('[API Logging] Initializing Supabase client for API logging');
  
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[API Logging] SUPABASE_URL or SUPABASE_KEY not defined, API logging will not work');
    return null;
  }
  
  console.log(`[API Logging] Supabase client initialized with URL: ${supabaseUrl.substring(0, 15)}...`);
  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * ApiHandler wrapper that adds logging for all API requests to LLM providers
 */
export class LoggingApiHandler implements ApiHandler {
  private handler: ApiHandler;
  private supabase: SupabaseClient<Database> | null;
  
  constructor(handler: ApiHandler) {
    console.log('[API Logging] Creating LoggingApiHandler wrapper');
    this.handler = handler;
    this.supabase = createSupabaseLogger();
  }
  
  /**
   * Log an API request to Supabase
   */
  private async logApiRequest(
    provider: string, 
    endpoint: string, 
    request: any
  ): Promise<string | null> {
    console.log(`[API Logging] Attempting to log ${provider} API request to ${endpoint}`);
    
    if (!this.supabase) {
      console.warn('[API Logging] Supabase client not initialized, API logging will be skipped');
      return null;
    }
    
    try {
      console.log('[API Logging] Inserting log entry into api_logs table');
      const { data, error } = await this.supabase
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
   * Wrap the createMessage method to add logging
   */
  async *createMessage(
    systemPrompt: string, 
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    console.log('[API Logging] Intercepted createMessage call for logging');
    
    // Get the provider name from the model info
    const modelInfo = this.handler.getModel();
    const provider = modelInfo.id.split('-')[0] || 'unknown';
    
    // Prepare request data to log
    const requestData = {
      model: modelInfo.id,
      systemPrompt,
      messages,
    };
    
    // Log the request to Supabase
    await this.logApiRequest(provider, 'createMessage', requestData);
    
    // Forward the call to the original handler
    console.log('[API Logging] Forwarding request to original handler');
    yield* this.handler.createMessage(systemPrompt, messages);
  }
  
  /**
   * Forward getModel calls to the original handler
   */
  getModel(): { id: string; info: ModelInfo } {
    return this.handler.getModel();
  }
}

/**
 * Wrap an ApiHandler with logging functionality
 */
export function withLogging(handler: ApiHandler): ApiHandler {
  return new LoggingApiHandler(handler);
} 