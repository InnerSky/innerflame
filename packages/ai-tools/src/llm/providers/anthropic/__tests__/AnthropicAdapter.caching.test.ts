/**
 * Integration Tests for AnthropicAdapter Caching Feature
 * 
 * These tests verify the prompt caching capabilities of the AnthropicAdapter.
 * 
 * NOTE: These tests require a valid CLAUDE_API_KEY environment variable to be set.
 * Tests will be skipped if the API key is not available.
 * 
 * Run with: npm test -- AnthropicAdapter.caching
 */

import { 
  AnthropicAdapter, 
  createAnthropicAdapter,
  AnthropicResponse,
  DetailedTokenUsage
} from '../AnthropicAdapter.js';
import { Message, MessageRole } from '../../../interfaces/LLMProvider.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Skip tests if API key is not available
const API_KEY = process.env.CLAUDE_API_KEY;
const runTests = !!API_KEY;

// Test messages for caching
const testMessages: Message[] = [
  {
    role: MessageRole.SYSTEM,
    content: 'You are a helpful coding assistant.'
  },
  {
    role: MessageRole.USER,
    content: 'What are the pros and cons of using React hooks vs class components?'
  }
];

// Helper function to measure execution time
async function measureExecutionTime(fn: () => Promise<any>): Promise<number> {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  return endTime - startTime;
}

// Helper to print usage info in a nice format
function formatUsageInfo(usage: DetailedTokenUsage): string {
  let result = `Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}`;
  
  if (usage.cacheWriteTokens !== undefined) {
    result += `, Cache write tokens: ${usage.cacheWriteTokens}`;
  }
  
  if (usage.cacheReadTokens !== undefined) {
    result += `, Cache read tokens: ${usage.cacheReadTokens}`;
  }
  
  return result;
}

// Only run tests if API key is available
(runTests ? describe : describe.skip)('AnthropicAdapter Caching Tests', () => {
  // Long timeout for API calls
  jest.setTimeout(120000);
  
  describe('Caching with Claude 3.5', () => {
    let adapter: AnthropicAdapter;
    
    beforeAll(() => {
      // Create adapter with Claude 3.5 Sonnet and caching enabled
      adapter = createAnthropicAdapter(API_KEY as string, {
        defaultModel: 'claude-3-5-sonnet-20241022',
        enableCaching: true
      });
    });
    
    it('should demonstrate cache writing on first request and reading on second', async () => {
      // First request should write to cache
      console.log('Making first request (should write to cache)...');
      const firstResponse = await adapter.sendMessage(testMessages) as AnthropicResponse;
      
      // Log the detailed usage information
      console.log('First request usage:', formatUsageInfo(firstResponse.detailedUsage!));
      
      // Verify it includes cache write tokens
      expect(firstResponse.detailedUsage).toBeDefined();
      expect(firstResponse.detailedUsage?.cacheWriteTokens).toBeGreaterThan(0);
      
      // Wait a bit to ensure the cache is available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Second identical request should read from cache
      console.log('Making second identical request (should read from cache)...');
      const secondResponse = await adapter.sendMessage(testMessages) as AnthropicResponse;
      
      // Log the detailed usage information
      console.log('Second request usage:', formatUsageInfo(secondResponse.detailedUsage!));
      
      // Verify it includes cache read tokens
      expect(secondResponse.detailedUsage).toBeDefined();
      expect(secondResponse.detailedUsage?.cacheReadTokens).toBeGreaterThan(0);
      
      // The second request should have significantly lower input tokens
      expect(secondResponse.detailedUsage?.inputTokens).toBeLessThan(firstResponse.detailedUsage?.inputTokens!);
    });
    
    it('should demonstrate performance improvement with caching', async () => {
      // First execution time (cache may already exist)
      const firstTime = await measureExecutionTime(async () => {
        await adapter.sendMessage(testMessages);
      });
      
      console.log(`First execution time: ${firstTime.toFixed(2)}ms`);
      
      // Second execution time (should benefit from cache)
      const secondTime = await measureExecutionTime(async () => {
        await adapter.sendMessage(testMessages);
      });
      
      console.log(`Second execution time: ${secondTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((firstTime - secondTime) / firstTime * 100).toFixed(2)}%`);
      
      // The second request should be at least somewhat faster
      // We're not asserting exact values because network conditions can vary
      expect(secondTime).toBeLessThan(firstTime);
    });
  });
  
  describe('Caching controls', () => {
    let adapter: AnthropicAdapter;
    
    beforeAll(() => {
      // Create adapter with caching disabled by default
      adapter = createAnthropicAdapter(API_KEY as string, {
        defaultModel: 'claude-3-5-sonnet-20241022',
        enableCaching: false
      });
    });
    
    it('should enable and disable caching via adapter methods', async () => {
      // Initially caching should be disabled
      expect(adapter.isCachingEnabled()).toBe(false);
      
      // Enable caching
      adapter.setCaching(true);
      expect(adapter.isCachingEnabled()).toBe(true);
      
      // Make a request with caching enabled
      console.log('Making request with caching enabled...');
      const cachedResponse = await adapter.sendMessage(testMessages) as AnthropicResponse;
      
      // Log the detailed usage information
      console.log('Cached request usage:', formatUsageInfo(cachedResponse.detailedUsage!));
      
      // Verify it includes cache-related tokens
      expect(cachedResponse.detailedUsage).toBeDefined();
      expect(cachedResponse.detailedUsage?.cacheWriteTokens || cachedResponse.detailedUsage?.cacheReadTokens)
        .toBeGreaterThan(0);
      
      // Disable caching
      adapter.setCaching(false);
      expect(adapter.isCachingEnabled()).toBe(false);
      
      // Make a request with caching disabled
      console.log('Making request with caching disabled...');
      const uncachedResponse = await adapter.sendMessage(testMessages) as AnthropicResponse;
      
      // Log the detailed usage information
      console.log('Uncached request usage:', formatUsageInfo(uncachedResponse.detailedUsage!));
      
      // Verify it doesn't include cache read tokens
      expect(uncachedResponse.detailedUsage).toBeDefined();
      expect(uncachedResponse.detailedUsage?.cacheReadTokens).toBeUndefined();
    });
    
    it('should override adapter caching settings with request options', async () => {
      // Set adapter-level caching to disabled
      adapter.setCaching(false);
      
      // Make a request with caching enabled via request options
      console.log('Making request with caching enabled via options...');
      const cachedResponse = await adapter.sendMessage(testMessages, {
        enableCaching: true
      }) as AnthropicResponse;
      
      // Log the detailed usage information
      console.log('Request with enableCaching=true usage:', formatUsageInfo(cachedResponse.detailedUsage!));
      
      // Verify it includes cache-related tokens
      expect(cachedResponse.detailedUsage).toBeDefined();
      expect(cachedResponse.detailedUsage?.cacheWriteTokens || cachedResponse.detailedUsage?.cacheReadTokens)
        .toBeGreaterThan(0);
      
      // Set adapter-level caching to enabled
      adapter.setCaching(true);
      
      // Make a request with caching disabled via request options
      console.log('Making request with caching disabled via options...');
      const uncachedResponse = await adapter.sendMessage(testMessages, {
        enableCaching: false
      }) as AnthropicResponse;
      
      // Log the detailed usage information
      console.log('Request with enableCaching=false usage:', formatUsageInfo(uncachedResponse.detailedUsage!));
      
      // Verify it doesn't include cache read tokens
      expect(uncachedResponse.detailedUsage).toBeDefined();
      expect(uncachedResponse.detailedUsage?.cacheReadTokens).toBeUndefined();
    });
  });
  
  describe('Caching with streaming responses', () => {
    let adapter: AnthropicAdapter;
    
    beforeAll(() => {
      // Create adapter with Claude 3.5 Sonnet and caching enabled
      adapter = createAnthropicAdapter(API_KEY as string, {
        defaultModel: 'claude-3-5-sonnet-20241022',
        enableCaching: true
      });
    });
    
    it('should include usage information in streaming responses', async () => {
      // Set up stream request with caching enabled
      const stream = await adapter.streamMessage(testMessages);
      
      // Create a reader to process the stream
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let usageChunks = 0;
      let finalUsageChunk = null;
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
              
              if (parsed.type === 'usage_info') {
                usageChunks++;
              } else if (parsed.type === 'final_usage_info') {
                finalUsageChunk = parsed;
              }
            } catch (error) {
              console.error('Error parsing stream data:', error);
            }
          }
        }
      }
      
      console.log(`Received ${usageChunks} usage update chunks`);
      if (finalUsageChunk) {
        console.log('Final usage info:', formatUsageInfo(finalUsageChunk.usage));
      }
      
      // Verify we received usage updates
      expect(usageChunks).toBeGreaterThan(0);
      expect(finalUsageChunk).not.toBeNull();
      expect(finalUsageChunk?.usage.inputTokens).toBeGreaterThan(0);
      expect(finalUsageChunk?.usage.outputTokens).toBeGreaterThan(0);
      
      // At least one of cacheWrite or cacheRead should be present
      const hasCacheMetrics = 
        finalUsageChunk?.usage.cacheWriteTokens !== undefined ||
        finalUsageChunk?.usage.cacheReadTokens !== undefined;
        
      expect(hasCacheMetrics).toBe(true);
    });
  });
}); 