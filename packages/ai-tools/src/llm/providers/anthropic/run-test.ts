/**
 * Simple test script for AnthropicAdapter that makes real API calls
 * Loads the CLAUDE_API_KEY from .env file if available
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { AnthropicAdapter, AnthropicResponse } from './AnthropicAdapter.js';
import { Message, MessageRole } from '../../interfaces/LLMProvider.js';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const apiKey = process.env.CLAUDE_API_KEY;

if (!apiKey) {
  console.error('❌ CLAUDE_API_KEY environment variable is not set. Please set it in your .env file.');
  process.exit(1);
}

// Test messages
const messages: Message[] = [
  { role: MessageRole.USER, content: 'What is the capital of France?' }
];

async function runTests() {
  console.log('🧪 Testing AnthropicAdapter with real API calls...');
  
  // Create adapter instance - we know apiKey is defined because of the check above
  const adapter = new AnthropicAdapter(apiKey as string, {
    defaultModel: 'claude-3-haiku-20240307',
    defaultMaxTokens: 500
  });
  
  console.log('✅ Adapter created successfully');
  
  // Test sendMessage
  console.log('\n🔄 Testing sendMessage...');
  try {
    const response = await adapter.sendMessage(messages);
    console.log('📝 Response:', response.content);
    console.log('📊 Token usage:', response.usage);
    
    // If it's an AnthropicResponse, log detailed usage
    const anthropicResponse = response as AnthropicResponse;
    if (anthropicResponse.detailedUsage) {
      console.log('📊 Detailed usage:', anthropicResponse.detailedUsage);
    }
  } catch (error) {
    console.error('❌ Error in sendMessage:', error);
  }
  
  // Test streamMessage
  console.log('\n🔄 Testing streamMessage...');
  try {
    let fullResponse = '';
    const stream = await adapter.streamMessage(messages);
    
    console.log('📝 Streaming response:');
    
    // Handle the stream properly
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      process.stdout.write(chunk);
      fullResponse += chunk;
    }
    
    console.log('\n\n📊 Full response received, length:', fullResponse.length);
  } catch (error) {
    console.error('❌ Error in streamMessage:', error);
  }
}

runTests().catch(console.error); 