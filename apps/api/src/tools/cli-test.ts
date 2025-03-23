#!/usr/bin/env node

/**
 * CLI tool for testing the LangGraph agent
 * 
 * This script provides a simple command-line interface for interacting
 * with the agent and testing its capabilities.
 */

import 'dotenv/config';
import readline from 'readline';
import { initializeLLMProvider, initializeLLMAdapter, createAgent } from '../services/ai/index.js';
import { createDocumentUpdateTool } from '@innerflame/ai-tools/src/tools/documentUpdate.js';
import { AgentContext } from '@innerflame/ai-tools/src/langgraph/types.js';

// Initialize LLM provider and adapter
const llmProvider = initializeLLMProvider();
const llmAdapter = initializeLLMAdapter(llmProvider);

// Create an agent with the document update tool
const tools = [createDocumentUpdateTool()];
const agent = createAgent(llmAdapter, tools);

// Sample document for testing
const sampleDocument = {
  id: 'doc-123',
  title: 'My Test Document',
  content: 'This is a sample document for testing the LangGraph agent.',
};

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Define context for the agent
const context: AgentContext = {
  userId: 'user-123',
  documentId: sampleDocument.id,
  documentTitle: sampleDocument.title,
  documentContent: sampleDocument.content,
  contextType: 'document'
};

console.log('\n🔥 InnerFlame Agent CLI Testing Tool 🔥\n');
console.log('Current document context:');
console.log(`- Document ID: ${context.documentId}`);
console.log(`- Title: ${context.documentTitle}`);
console.log(`- Content: ${context.documentContent}`);
console.log('\nType your message and press Enter to interact with the agent.');
console.log('Type "exit" to quit the program.\n');

// Start the conversation loop
async function startConversation() {
  rl.question('You: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }
    
    try {
      console.log('\nAgent is thinking...');
      
      // Call the agent with the user input
      const result = await agent(input, context);
      
      // Log all messages for debugging
      console.log('\n--- Message History ---');
      result.messages.forEach((msg, index) => {
        if (index > 0) {
          console.log(`\n[${msg.role}] ${msg.content}`);
          
          if (msg.toolCall) {
            console.log(`\n🔧 Tool Call: ${msg.toolCall.name}`);
            console.log(`Parameters: ${JSON.stringify(msg.toolCall.args, null, 2)}`);
          }
          
          if (msg.toolResult) {
            console.log(`\n🔩 Tool Result: ${JSON.stringify(msg.toolResult, null, 2)}`);
          }
        }
      });
      console.log('------------------------\n');
      
      // Extract the assistant's response (last assistant message)
      const assistantMessages = result.messages.filter(m => m.role === 'assistant');
      const response = assistantMessages[assistantMessages.length - 1];
      
      console.log('Agent: ' + response.content);
      
      // If we have a tool result, update our sample document
      if (result.result) {
        if (result.result.documentId === sampleDocument.id) {
          sampleDocument.content = result.result.newContent || sampleDocument.content;
          context.documentContent = sampleDocument.content;
          
          console.log('\nDocument has been updated!');
          console.log(`New content: ${sampleDocument.content}`);
        }
      }
      
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Continue the conversation
    startConversation();
  });
}

// Start the conversation
startConversation(); 