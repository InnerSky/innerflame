/**
 * Direct test using fetch to call the Anthropic API
 * This avoids using the adapter or handler to isolate any issues
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../../../.env') });

console.log('🔍 Looking for .env file at:', path.resolve(__dirname, '../../../../../../.env'));

const apiKey = process.env.CLAUDE_API_KEY;

if (!apiKey) {
  console.error('❌ CLAUDE_API_KEY environment variable is not set. Please set it in your .env file.');
  process.exit(1);
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function sendMessage(messages: AnthropicMessage[]) {
  console.log('🧪 Sending direct message to Anthropic API...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey as string,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 500,
      messages: messages
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

async function streamMessage(messages: AnthropicMessage[]) {
  console.log('🧪 Streaming direct message from Anthropic API...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey as string,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 500,
      messages: messages,
      stream: true
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
  }
  
  return response;
}

async function runTests() {
  const messages: AnthropicMessage[] = [
    { role: 'user', content: 'What is the capital of France?' }
  ];
  
  // Test regular message
  try {
    const result = await sendMessage(messages);
    console.log('📝 Response:', result.content[0].text);
    console.log('📊 Usage:', result.usage);
  } catch (error) {
    console.error('❌ Error in regular message:', error);
  }
  
  // Test streaming message
  try {
    const response = await streamMessage(messages);
    if (!response.body) {
      console.error('❌ No stream returned');
      return;
    }
    
    console.log('📝 Streaming response:');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
              process.stdout.write(data.delta.text);
              fullResponse += data.delta.text;
            } else if (data.type === 'message_stop') {
              console.log('\n\n📊 Stream complete');
            }
          } catch (e) {
            if (line.trim() !== 'data: [DONE]') {
              console.error('❌ Error parsing SSE data:', line, e);
            }
          }
        }
      }
    }
    
    // Process any remaining data in the buffer
    console.log('\n📊 Full response received, length:', fullResponse.length);
  } catch (error) {
    console.error('❌ Error in streaming message:', error);
  }
}

runTests().catch(console.error); 