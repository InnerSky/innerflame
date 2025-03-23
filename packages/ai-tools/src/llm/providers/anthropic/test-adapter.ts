/**
 * Test script for AnthropicAdapter
 * 
 * This script tests both synchronous and streaming message functionality
 * of our AnthropicAdapter implementation.
 * 
 * Usage:
 * 1. Set CLAUDE_API_KEY environment variable
 * 2. Run with ts-node: npx ts-node src/llm/providers/anthropic/test-adapter.ts
 */

import { createAnthropicAdapter } from './AnthropicAdapter.js';
import { Message, MessageRole } from '../../interfaces/LLMProvider.js';
import * as dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

// Load environment variables
dotenv.config();

// We check for API key and exit if not present, so TypeScript can be confident API_KEY is defined
const API_KEY = process.env.CLAUDE_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Error: CLAUDE_API_KEY environment variable is required');
  console.log('Please set the CLAUDE_API_KEY environment variable and try again.');
  process.exit(1);
}

// Create test messages
const messages: Message[] = [
  {
    role: MessageRole.SYSTEM,
    content: 'You are a helpful AI assistant. Keep your answers brief and to the point.'
  },
  {
    role: MessageRole.USER,
    content: 'What is the capital of France? Include a fun fact about it.'
  }
];

// Test options
const options = {
  model: 'claude-3-5-sonnet-20240620',
  temperature: 0.7,
};

async function runTests() {
  console.log('🧪 AnthropicAdapter Test Suite\n');
  
  try {
    // Initialize adapter
    console.log('📦 Creating AnthropicAdapter...');
    const adapter = createAnthropicAdapter(API_KEY, {
      defaultModel: 'claude-3-5-sonnet-20240620'
    });
    console.log('✅ Adapter created successfully\n');

    // Test 1: Synchronous message
    console.log('🔄 TEST 1: Synchronous Message');
    console.log('Sending message...');
    
    console.time('Sync response time');
    try {
      const response = await adapter.sendMessage(messages, options);
      console.timeEnd('Sync response time');
      
      console.log('✅ Received response:');
      console.log(`Content: ${response.content}`);
      if (response.usage) {
        console.log('📊 Token Usage:');
        console.log(`  Input tokens: ${response.usage.inputTokens}`);
        console.log(`  Output tokens: ${response.usage.outputTokens}`);
        console.log(`  Total tokens: ${response.usage.inputTokens + response.usage.outputTokens}`);
      }
    } catch (error) {
      console.error('❌ Synchronous test failed:', error);
    }
    
    console.log('\n' + '-'.repeat(50) + '\n');

    // Test 2: Streaming message
    console.log('🔄 TEST 2: Streaming Message');
    console.log('Sending streaming message...');
    
    console.time('Stream total time');
    try {
      const stream = await adapter.streamMessage(messages, options);
      const reader = stream.getReader();
      
      let fullText = '';
      let chunkCount = 0;
      
      console.log('📬 Receiving stream chunks:');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        fullText += chunk;
        chunkCount++;
        
        console.log(`Chunk ${chunkCount}: ${chunk.length} bytes`);
        // Print chunk content but limit to 50 chars
        const preview = chunk.length > 50 ? chunk.substring(0, 50) + '...' : chunk;
        console.log(`  Content: "${preview}"`);
        
        // Small delay to make output more readable
        await setTimeout(10);
      }
      
      console.timeEnd('Stream total time');
      console.log(`✅ Streaming completed with ${chunkCount} chunks`);
      console.log(`Full response (${fullText.length} chars):`);
      console.log(fullText);
    } catch (error) {
      console.error('❌ Streaming test failed:', error);
    }

    console.log('\n' + '-'.repeat(50) + '\n');
    console.log('✅ All tests completed');
    
  } catch (error) {
    console.error('❌ Test script failed:', error);
  }
}

// Run the tests
runTests().catch(console.error); 