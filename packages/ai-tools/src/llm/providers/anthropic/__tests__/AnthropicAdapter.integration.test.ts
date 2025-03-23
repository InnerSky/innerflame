/**
 * Integration tests for AnthropicAdapter
 * 
 * These tests make real API calls to the Anthropic API.
 * They require a valid API key to be set in the CLAUDE_API_KEY environment variable.
 */

import { AnthropicAdapter } from '../AnthropicAdapter.js';
import { Message, MessageRole } from '../../../interfaces/LLMProvider.js';
import * as dotenv from 'dotenv';

// Load environment variables - we don't need path resolution for Jest tests
// as they run from the project root by default
dotenv.config();

// Only run tests if API key is available
const apiKey = process.env.CLAUDE_API_KEY;
const hasApiKey = !!apiKey;

// Skip all tests if no API key is available
const itIfApiKey = hasApiKey ? it : it.skip;

// Test messages
const messages: Message[] = [
  { role: MessageRole.USER, content: 'What is the capital of France?' }
];

describe('AnthropicAdapter Integration Tests', () => {
  let adapter: AnthropicAdapter;
  
  beforeAll(() => {
    if (hasApiKey) {
      adapter = new AnthropicAdapter(apiKey as string, {
        defaultModel: 'claude-3-haiku-20240307'
      });
    }
  });
  
  describe('sendMessage', () => {
    itIfApiKey('should return a valid response', async () => {
      const response = await adapter.sendMessage(messages);
      
      // Verify response structure
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.model).toBeDefined();
      
      // Verify response content contains "Paris"
      expect(response.content).toContain('Paris');
      
      // Verify token usage
      expect(response.usage).toBeDefined();
      expect(response.usage?.inputTokens).toBeGreaterThan(0);
      expect(response.usage?.outputTokens).toBeGreaterThan(0);
      
      // Log response for manual inspection
      console.log('Response:', {
        content: response.content,
        model: response.model,
        usage: response.usage
      });
    }, 30000); // Extend timeout for API call
  });
  
  describe('streamMessage', () => {
    itIfApiKey('should stream a valid response', async () => {
      const stream = await adapter.streamMessage(messages);
      expect(stream).toBeDefined();
      
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      let fullText = '';
      
      // Read all chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        const textDecoder = new TextDecoder();
        const chunk = textDecoder.decode(value);
        fullText += chunk;
      }
      
      // Verify we got some chunks
      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify response contains "Paris"
      expect(fullText).toContain('Paris');
      
      // Log for manual inspection
      console.log('Received stream with', chunks.length, 'chunks');
      console.log('Full text length:', fullText.length);
    }, 30000); // Extend timeout for API call
  });
}); 