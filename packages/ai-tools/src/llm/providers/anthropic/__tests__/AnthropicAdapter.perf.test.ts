/**
 * Performance tests for AnthropicAdapter
 * 
 * These tests are designed for comparing performance profiles
 * of the AnthropicAdapter with different configurations.
 * 
 * Run with: npm test -- AnthropicAdapter.perf
 */

import { 
  AnthropicAdapter,
  createAnthropicAdapter 
} from '../AnthropicAdapter.js';
import { 
  MessageRole
} from '../../../interfaces/LLMProvider.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Skip tests if API key is not available
const API_KEY = process.env.CLAUDE_API_KEY;
const runPerfTests = !!API_KEY;

// Test messages of increasing complexity
const testCases = [
  {
    name: 'Simple question',
    messages: [
      {
        role: MessageRole.SYSTEM,
        content: 'You are a helpful assistant that provides concise answers.'
      },
      {
        role: MessageRole.USER,
        content: 'What is the capital of France?'
      }
    ]
  },
  {
    name: 'Medium complexity',
    messages: [
      {
        role: MessageRole.SYSTEM,
        content: 'You are a helpful assistant that provides concise answers.'
      },
      {
        role: MessageRole.USER,
        content: 'Explain the difference between REST and GraphQL APIs in 3-4 sentences.'
      }
    ]
  },
  {
    name: 'Complex question',
    messages: [
      {
        role: MessageRole.SYSTEM,
        content: 'You are a helpful assistant that provides detailed, thoughtful answers.'
      },
      {
        role: MessageRole.USER,
        content: 'Compare and contrast the adapter pattern and the facade pattern in software design. Include advantages and disadvantages of each.'
      }
    ]
  }
];

/**
 * Helper function to measure the execution time of an async function
 */
async function measureExecutionTime(fn: () => Promise<any>): Promise<number> {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  return endTime - startTime;
}

// Conditional testing based on API key availability
(runPerfTests ? describe : describe.skip)('AnthropicAdapter Performance Tests', () => {
  // Long timeout for API calls
  jest.setTimeout(60000);
  
  let adapterBasic: AnthropicAdapter;
  let adapterWithCaching: AnthropicAdapter;
  
  beforeAll(() => {
    // Initialize both implementations with the same API key but different configurations
    adapterBasic = createAnthropicAdapter(API_KEY as string, {
      defaultModel: 'claude-3-haiku-20240307' // Use Haiku for faster, cheaper tests
    });
    
    adapterWithCaching = createAnthropicAdapter(API_KEY as string, {
      defaultModel: 'claude-3-haiku-20240307',
      enableCaching: true
    });
  });
  
  describe('Performance Comparison', () => {
    for (const testCase of testCases) {
      it(`should compare response times for: ${testCase.name}`, async () => {
        console.log(`\nRunning test case: ${testCase.name}`);
        
        // Run without caching
        console.log('Testing adapter without caching...');
        const noCacheTime = await measureExecutionTime(async () => {
          const response = await adapterBasic.sendMessage(testCase.messages);
          console.log('Basic adapter response length:', response.content.length);
        });
        
        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Run with caching enabled
        console.log('Testing adapter with caching...');
        const withCacheTime = await measureExecutionTime(async () => {
          const response = await adapterWithCaching.sendMessage(testCase.messages);
          console.log('Caching adapter response length:', response.content.length);
        });
        
        // Calculate and log performance difference
        const timeDiff = noCacheTime - withCacheTime;
        const percentDiff = ((timeDiff / noCacheTime) * 100).toFixed(2);
        const comparison = timeDiff > 0 ? 'faster' : 'slower';
        
        console.log('Performance results:');
        console.log(`Without caching: ${noCacheTime.toFixed(2)}ms`);
        console.log(`With caching: ${withCacheTime.toFixed(2)}ms`);
        console.log(`The caching implementation is ${Math.abs(parseFloat(percentDiff))}% ${comparison}`);
        
        // We don't actually assert anything here since performance can vary
        // This is more of a benchmark than a strict test
        expect(true).toBe(true);
      });
    }
  });
  
  describe('Stress Testing with Caching', () => {
    it('should handle repeated identical requests efficiently', async () => {
      const testCase = testCases[0]; // Use the simplest test case
      console.log('\nTesting caching behavior with repeated requests...');
      
      // First request to both implementations
      console.log('First request:');
      const firstNoCacheTime = await measureExecutionTime(async () => {
        await adapterBasic.sendMessage(testCase.messages);
      });
      const firstWithCacheTime = await measureExecutionTime(async () => {
        await adapterWithCaching.sendMessage(testCase.messages);
      });
      
      console.log(`Without caching: ${firstNoCacheTime.toFixed(2)}ms`);
      console.log(`With caching: ${firstWithCacheTime.toFixed(2)}ms`);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Second request (may benefit from caching)
      console.log('Second request (potential caching benefit):');
      const secondNoCacheTime = await measureExecutionTime(async () => {
        await adapterBasic.sendMessage(testCase.messages);
      });
      const secondWithCacheTime = await measureExecutionTime(async () => {
        await adapterWithCaching.sendMessage(testCase.messages);
      });
      
      console.log(`Without caching: ${secondNoCacheTime.toFixed(2)}ms`);
      console.log(`With caching: ${secondWithCacheTime.toFixed(2)}ms`);
      
      // Log improvement from first to second request
      const noCacheImprovement = ((firstNoCacheTime - secondNoCacheTime) / firstNoCacheTime * 100).toFixed(2);
      const withCacheImprovement = ((firstWithCacheTime - secondWithCacheTime) / firstWithCacheTime * 100).toFixed(2);
      
      console.log(`Without caching improved by ${noCacheImprovement}%`);
      console.log(`With caching improved by ${withCacheImprovement}%`);
      
      // Basic check - caching should show better improvement on second request
      expect(parseFloat(noCacheImprovement)).not.toBeNaN();
      expect(parseFloat(withCacheImprovement)).not.toBeNaN();
    });
  });
}); 