/**
 * Tests for AnthropicHandler
 * These tests verify the handler's functionality with the refactored retry logic
 */

import { AnthropicHandler } from '../anthropic.js';
import { ApiHandlerOptions } from '../../../shared/api.js';
import { Anthropic } from '@anthropic-ai/sdk';

// Skip tests if no API key is available
const apiKey = process.env.CLAUDE_API_KEY;
const hasApiKey = !!apiKey;
const itIfApiKey = hasApiKey ? it : it.skip;

describe('AnthropicHandler', () => {
  describe('constructor', () => {
    it('should create an instance with valid options', () => {
      const options: ApiHandlerOptions = {
        apiKey: 'test-key',
        apiModelId: 'claude-3-haiku-20240307'
      };
      
      const handler = new AnthropicHandler(options);
      expect(handler).toBeInstanceOf(AnthropicHandler);
    });
    
    it('should use the provided model ID', () => {
      const options: ApiHandlerOptions = {
        apiKey: 'test-key',
        apiModelId: 'claude-3-haiku-20240307'
      };
      
      const handler = new AnthropicHandler(options);
      const model = handler.getModel();
      expect(model.id).toBe('claude-3-haiku-20240307');
    });
  });
  
  // Tests that require an API key
  describe('API integration', () => {
    itIfApiKey('should create a message without errors', async () => {
      // This test will be skipped if no API key is available
      const options: ApiHandlerOptions = {
        apiKey: apiKey as string,
        apiModelId: 'claude-3-haiku-20240307'
      };
      
      const handler = new AnthropicHandler(options);
      const systemPrompt = 'You are a helpful assistant.';
      const messages: Anthropic.Messages.MessageParam[] = [
        { role: 'user', content: 'What is the capital of France?' }
      ];
      
      // Call createMessage and collect the yielded values
      const stream = handler.createMessage(systemPrompt, messages);
      const results: any[] = [];
      
      for await (const chunk of stream) {
        results.push(chunk);
      }
      
      // Check that we received some results
      expect(results.length).toBeGreaterThan(0);
      
      // Verify that we got text chunks in the response
      const textChunks = results.filter(chunk => chunk.type === 'text');
      expect(textChunks.length).toBeGreaterThan(0);
      
      // Join all text chunks to get the complete response
      const fullText = textChunks.map(chunk => chunk.text).join('');
      expect(fullText).toContain('Paris');
      
      // Verify we got usage information
      const usageChunks = results.filter(chunk => chunk.type === 'usage');
      expect(usageChunks.length).toBeGreaterThan(0);
    }, 30000); // Extend timeout for API call
  });
}); 