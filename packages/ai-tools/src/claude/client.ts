import { z } from 'zod';

/**
 * Claude API client for InnerFlame
 * 
 * This module provides a simplified interface for interacting with Anthropic's Claude API
 * with proper error handling and typing.
 */

// API constants
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-haiku-20240307';
const DEFAULT_MAX_TOKENS = 1024;

// Types and schemas for Claude API
export enum ClaudeRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ClaudeMessage {
  role: ClaudeRole;
  content: string;
}

export interface ClaudeRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface ClaudeResponse {
  id: string;
  content: string;
  model: string;
  role: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Error class for Claude API errors
export class ClaudeApiError extends Error {
  statusCode?: number;
  errorType?: string;
  
  constructor(message: string, statusCode?: number, errorType?: string) {
    super(message);
    this.name = 'ClaudeApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

/**
 * Claude API client class
 * 
 * For tool calling, we use a special notation in the system prompt: {{tool_name: args}}
 * Claude doesn't have native tool calling, so we parse responses for this pattern.
 */
export class ClaudeClient {
  private apiKey: string;
  private defaultModel: string;
  private defaultMaxTokens: number;
  
  constructor(apiKey: string, options?: { 
    defaultModel?: string;
    defaultMaxTokens?: number;
  }) {
    if (!apiKey) {
      throw new Error('Claude API key is required');
    }
    
    this.apiKey = apiKey;
    this.defaultModel = options?.defaultModel || DEFAULT_MODEL;
    this.defaultMaxTokens = options?.defaultMaxTokens || DEFAULT_MAX_TOKENS;
  }
  
  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(
    messages: ClaudeMessage[],
    options: ClaudeRequestOptions = {}
  ): Promise<ClaudeResponse> {
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          max_tokens: options.maxTokens || this.defaultMaxTokens,
          temperature: options.temperature ?? 0.7,
          system: options.systemPrompt || undefined,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new ClaudeApiError(
          errorData.error?.message || 'Unknown Claude API error',
          response.status,
          errorData.error?.type
        );
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        content: data.content[0].text,
        model: data.model,
        role: data.role,
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens
        }
      };
    } catch (error) {
      if (error instanceof ClaudeApiError) {
        throw error;
      }
      
      throw new ClaudeApiError(
        error instanceof Error ? error.message : 'Unknown error during Claude API call',
        500,
        'client_error'
      );
    }
  }
  
  /**
   * Create a streaming message request to Claude
   * This returns a ReadableStream that can be consumed by the client
   */
  async createStreamingMessage(
    messages: ClaudeMessage[],
    options: ClaudeRequestOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          max_tokens: options.maxTokens || this.defaultMaxTokens,
          temperature: options.temperature ?? 0.7,
          system: options.systemPrompt || undefined,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          stream: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new ClaudeApiError(
          errorData.error?.message || 'Unknown Claude API error',
          response.status,
          errorData.error?.type
        );
      }
      
      return response.body!;
    } catch (error) {
      if (error instanceof ClaudeApiError) {
        throw error;
      }
      
      throw new ClaudeApiError(
        error instanceof Error ? error.message : 'Unknown error during Claude API streaming call',
        500,
        'client_error'
      );
    }
  }
}

/**
 * Create a Claude client with the provided API key
 */
export function createClaudeClient(
  apiKey: string,
  options?: { 
    defaultModel?: string;
    defaultMaxTokens?: number;
  }
): ClaudeClient {
  return new ClaudeClient(apiKey, options);
} 