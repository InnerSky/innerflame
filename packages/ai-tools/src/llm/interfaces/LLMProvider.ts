/**
 * LLM Provider Interface
 * 
 * This defines the core interface that all LLM providers must implement.
 * It provides a consistent API for interacting with different LLM services.
 */

// Basic message types for LLM providers
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  role: MessageRole;
  content: string;
}

// Request options shared by all providers
export interface RequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// Response structure from LLM providers
export interface LLMResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Error class for LLM API errors
export class LLMApiError extends Error {
  statusCode?: number;
  errorType?: string;
  
  constructor(message: string, statusCode?: number, errorType?: string) {
    super(message);
    this.name = 'LLMApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

/**
 * Core LLM Provider interface
 * All LLM providers must implement these methods
 */
export interface LLMProvider {
  /**
   * Send a message to the LLM and get a complete response
   */
  sendMessage(
    messages: Message[],
    options?: RequestOptions
  ): Promise<LLMResponse>;
  
  /**
   * Create a streaming message request to the LLM
   * Returns a ReadableStream that can be consumed by the client
   */
  streamMessage(
    messages: Message[],
    options?: RequestOptions
  ): Promise<ReadableStream<Uint8Array>>;
} 