/**
 * Integration Tests for AnthropicAdapter Extended Thinking Feature
 * 
 * These tests verify the extended thinking/reasoning capabilities of the AnthropicAdapter.
 * 
 * NOTE: These tests require a valid CLAUDE_API_KEY environment variable to be set.
 * Tests will be skipped if the API key is not available.
 * 
 * Run with: npm test -- AnthropicAdapter.thinking
 */

import { 
  AnthropicAdapter, 
  createAnthropicAdapter,
  AnthropicResponse
} from '../AnthropicAdapter.js';
import { Message, MessageRole } from '../../../interfaces/LLMProvider.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Skip tests if API key is not available
const API_KEY = process.env.CLAUDE_API_KEY;
const runTests = !!API_KEY;

// Test messages that require reasoning
const testMessages: Message[] = [
  {
    role: MessageRole.SYSTEM,
    content: 'You are a helpful assistant that carefully explains your reasoning.'
  },
  {
    role: MessageRole.USER,
    content: 'What is 15 × 17? Walk through the calculation step by step.'
  }
];

// Only run tests if API key is available
(runTests ? describe : describe.skip)('AnthropicAdapter Extended Thinking Tests', () => {
  // Long timeout for API calls
  jest.setTimeout(120000);
  
  describe('Extended Thinking with Claude 3.7', () => {
    let adapter: AnthropicAdapter;
    
    beforeAll(() => {
      // Create adapter with Claude 3.7 Sonnet
      adapter = createAnthropicAdapter(API_KEY as string, {
        defaultModel: 'claude-3-7-sonnet-20250219'
      });
    });
    
    it('should return reasoning when thinking is enabled', async () => {
      // Make request with thinking enabled
      const response = await adapter.sendMessage(testMessages, {
        enableThinking: true,
        thinkingBudget: 2000 // Allocate more tokens for complex reasoning
      }) as AnthropicResponse;
      
      console.log('Response with thinking enabled:');
      console.log('Content:', response.content.substring(0, 200) + '...');
      
      if (response.reasoning) {
        console.log('Reasoning (first 200 chars):', response.reasoning.substring(0, 200) + '...');
        console.log('Reasoning length:', response.reasoning.length);
      }
      
      // Verify the response contains reasoning
      expect(response.reasoning).toBeDefined();
      expect(response.reasoning?.length).toBeGreaterThan(0);
      
      // Verify the response includes the calculation result
      expect(response.content).toContain('255');
    });
    
    it('should not return reasoning when thinking is disabled', async () => {
      // Make request without enabling thinking
      const response = await adapter.sendMessage(testMessages) as AnthropicResponse;
      
      console.log('Response with thinking disabled:');
      console.log('Content:', response.content.substring(0, 200) + '...');
      
      // Verify the response doesn't contain reasoning
      expect(response.reasoning).toBeUndefined();
      
      // Verify the response still includes the calculation result
      expect(response.content).toContain('255');
    });
  });
  
  describe('Thinking with unsupported models', () => {
    let adapter: AnthropicAdapter;
    
    beforeAll(() => {
      // Create adapter with Claude 3 Haiku (doesn't support extended thinking)
      adapter = createAnthropicAdapter(API_KEY as string, {
        defaultModel: 'claude-3-haiku-20240307'
      });
    });
    
    it('should not return reasoning with unsupported models even when enabled', async () => {
      // Make request with thinking enabled on unsupported model
      const response = await adapter.sendMessage(testMessages, {
        enableThinking: true,
        thinkingBudget: 1000
      }) as AnthropicResponse;
      
      console.log('Unsupported model response:');
      console.log('Model:', response.model);
      console.log('Content (first 200 chars):', response.content.substring(0, 200) + '...');
      
      // Verify the response doesn't contain reasoning
      expect(response.reasoning).toBeUndefined();
      
      // Verify the model is correctly reported
      expect(response.model).toBe('claude-3-haiku-20240307');
      
      // Verify the response still includes the calculation result
      expect(response.content).toContain('255');
    });
  });
  
  describe('Streaming with thinking enabled', () => {
    let adapter: AnthropicAdapter;
    
    beforeAll(() => {
      // Create adapter with Claude 3.7 Sonnet
      adapter = createAnthropicAdapter(API_KEY as string, {
        defaultModel: 'claude-3-7-sonnet-20250219'
      });
    });
    
    it('should stream both content and thinking chunks when enabled', async () => {
      // Set up stream request with thinking enabled
      const stream = await adapter.streamMessage(testMessages, {
        enableThinking: true,
        thinkingBudget: 2000
      });
      
      // Create a reader to process the stream
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let contentChunks = 0;
      let thinkingChunks = 0;
      let isDone = false;
      
      // Process the stream
      while (!isDone) {
        const { done, value } = await reader.read();
        
        if (done) {
          isDone = true;
          break;
        }
        
        const text = decoder.decode(value);
        const lines = text.trim().split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (data === '[DONE]') {
              isDone = true;
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta') {
                contentChunks++;
              } else if (parsed.type === 'thinking_block_delta') {
                thinkingChunks++;
              }
            } catch (error) {
              console.error('Error parsing stream data:', error);
            }
          }
        }
      }
      
      console.log(`Received ${contentChunks} content chunks and ${thinkingChunks} thinking chunks`);
      
      // Verify we received both content and thinking chunks
      expect(contentChunks).toBeGreaterThan(0);
      expect(thinkingChunks).toBeGreaterThan(0);
    });
  });
}); 