import { 
  AgentState, 
  AgentMessage, 
  AgentMessageRole, 
  AgentContext, 
  AgentTool, 
  AgentOutput 
} from '@innerflame/ai-tools/src/langgraph/types.js';
import { 
  ClaudeClient, 
  ClaudeMessage, 
  ClaudeRole, 
  createClaudeClient 
} from '@innerflame/ai-tools/src/claude/client.js';
import { Response } from 'express';
import { 
  sendTokenChunk, 
  sendToolCall, 
  sendComplete, 
  sendError 
} from '../../controllers/sse.js';

/**
 * LangGraph agent implementation for InnerFlame API service
 * 
 * This implements a minimal agent for document interactions.
 */

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant for a document editing application called InnerFlame.
Your primary responsibility is to help users with their documents and projects.

When helping users:
- Provide concise, relevant information
- If you need to reference a document, use the tools provided
- Only use the tools when necessary
- Respond in a friendly, professional tone

IMPORTANT: To use a tool, format your response with the tool name and arguments in double curly braces like this:
{{toolName: {"arg1": "value1", "arg2": "value2"}}}

For example, to update a document:
{{updateDocument: {"documentId": "doc-123", "content": "New content", "reason": "User requested update"}}}

Only use tools when explicitly asked, and make sure to provide the required arguments.`;

// Create system message
const createSystemMessage = (customPrompt?: string): AgentMessage => ({
  role: AgentMessageRole.SYSTEM,
  content: customPrompt || DEFAULT_SYSTEM_PROMPT
});

// Convert agent messages to Claude format
const convertToClaudeMessages = (messages: AgentMessage[]): ClaudeMessage[] => {
  return messages.filter(msg => 
    msg.role === AgentMessageRole.USER || 
    msg.role === AgentMessageRole.ASSISTANT
  ).map(msg => {
    // We need to safely convert between enum types
    let claudeRole: ClaudeRole;
    
    if (msg.role === AgentMessageRole.USER) {
      claudeRole = ClaudeRole.USER;
    } else {
      claudeRole = ClaudeRole.ASSISTANT;
    }
    
    return {
      role: claudeRole,
      content: msg.content
    };
  });
};

/**
 * Initialize the Claude API client using environment variables
 */
export function initializeClaudeClient(): ClaudeClient {
  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';
  const maxTokens = process.env.CLAUDE_MAX_TOKENS 
    ? parseInt(process.env.CLAUDE_MAX_TOKENS, 10) 
    : 1024;
  
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY environment variable is not set');
  }
  
  console.log(`Initializing Claude client with model: ${model}`);
  
  return createClaudeClient(apiKey, {
    defaultModel: model,
    defaultMaxTokens: maxTokens
  });
}

/**
 * Create a simplified agent with the provided Claude client and tools
 */
export function createAgent(claudeClient: ClaudeClient, tools: AgentTool[] = []) {
  
  /**
   * Run the agent with the provided input
   */
  return async (input: string, context: AgentContext): Promise<AgentOutput> => {
    // Initialize state
    let state: AgentState = {
      messages: [
        createSystemMessage(),
        {
          role: AgentMessageRole.USER,
          content: input
        }
      ],
      context,
      tools,
    };
    
    // Process the user input
    try {
      // Get the system message and user message
      const systemMessage = state.messages.find(m => m.role === AgentMessageRole.SYSTEM);
      const userMessage = state.messages.find(m => m.role === AgentMessageRole.USER);
      
      if (!userMessage) {
        throw new Error('No user message found');
      }
      
      // Convert messages to Claude format (only user and assistant messages)
      const claudeMessages = convertToClaudeMessages(state.messages);
      
      // Add context information to system prompt if available
      let systemPrompt = systemMessage?.content || DEFAULT_SYSTEM_PROMPT;
      
      if (state.context) {
        const ctx = state.context;
        let contextInfo = '';
        
        if (ctx.contextType === 'document' && ctx.documentId) {
          contextInfo = `\nCurrent document context:
- Document ID: ${ctx.documentId}
- Document title: ${ctx.documentTitle || 'Untitled'}
${ctx.documentContent ? `- Document content preview: ${ctx.documentContent.substring(0, 200)}...` : ''}`;
        } else if (ctx.contextType === 'project' && ctx.projectId) {
          contextInfo = `\nCurrent project context:
- Project ID: ${ctx.projectId}
- Project name: ${ctx.projectName || 'Unnamed Project'}`;
        }
        
        systemPrompt += contextInfo;
      }
      
      // Add tool descriptions if available
      if (state.tools && state.tools.length > 0) {
        let toolsInfo = '\n\nAvailable tools:\n';
        
        state.tools.forEach(tool => {
          toolsInfo += `- ${tool.name}: ${tool.description}\n`;
        });
        
        systemPrompt += toolsInfo;
      }
      
      // Generate a response using Claude
      const response = await claudeClient.sendMessage(claudeMessages, {
        systemPrompt,
        temperature: 0.7,
      });
      
      // Create assistant message
      const assistantMessage: AgentMessage = {
        role: AgentMessageRole.ASSISTANT,
        content: response.content
      };
      
      // Add the assistant message to the state
      state.messages.push(assistantMessage);
      
      // Check if response contains a tool call
      const toolCallRegex = /\{\{([^}]+)\}\}/;
      const match = response.content.match(toolCallRegex);
      
      if (match && state.tools) {
        try {
          const toolCallText = match[1];
          const [toolName, ...argsText] = toolCallText.split(':');
          const trimmedToolName = toolName.trim();
          
          // Find the tool
          const tool = state.tools.find(t => t.name === trimmedToolName);
          
          if (tool) {
            // Parse arguments
            const argsString = argsText.join(':').trim();
            let args: Record<string, any> = {};
            
            try {
              args = JSON.parse(argsString);
            } catch (e) {
              // Simple parsing for key-value pairs if JSON parsing fails
              const keyValuePairs = argsString.split(',').map(pair => pair.trim());
              keyValuePairs.forEach(pair => {
                const [key, value] = pair.split('=').map(part => part.trim());
                if (key) {
                  args[key] = value;
                }
              });
            }
            
            // Update the assistant message with the tool call
            assistantMessage.toolCall = {
              name: trimmedToolName,
              args
            };
            
            // Execute the tool
            try {
              const result = await tool.handler(args, context);
              
              // Create tool result message
              const toolResultMessage: AgentMessage = {
                role: AgentMessageRole.TOOL_RESULT,
                content: JSON.stringify(result),
                toolResult: result
              };
              
              // Add the tool result message to the state
              state.messages.push(toolResultMessage);
              
              // Generate a follow-up response
              const followUpClaudeMessages = convertToClaudeMessages([
                ...state.messages.filter(msg => 
                  msg.role === AgentMessageRole.USER || 
                  msg.role === AgentMessageRole.ASSISTANT
                ),
                {
                  role: AgentMessageRole.USER,
                  content: `The tool ${trimmedToolName} was executed with the following result: ${JSON.stringify(result)}`
                }
              ]);
              
              const followUpResponse = await claudeClient.sendMessage(followUpClaudeMessages, {
                systemPrompt,
                temperature: 0.7,
              });
              
              // Create follow-up assistant message
              const followUpAssistantMessage: AgentMessage = {
                role: AgentMessageRole.ASSISTANT,
                content: followUpResponse.content
              };
              
              // Add the follow-up assistant message to the state
              state.messages.push(followUpAssistantMessage);
              
              // Return the final state
              return {
                messages: state.messages,
                result: result
              };
            } catch (error) {
              // Create error message
              const errorMessage: AgentMessage = {
                role: AgentMessageRole.TOOL_RESULT,
                content: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
                toolResult: { error: true, message: error instanceof Error ? error.message : 'Unknown error' }
              };
              
              // Add the error message to the state
              state.messages.push(errorMessage);
              
              // Return the state with the error
              return {
                messages: state.messages,
                error: error instanceof Error ? error.message : 'Unknown error in tool execution'
              };
            }
          }
        } catch (e) {
          console.error('Error parsing tool call:', e);
        }
      }
      
      // If no tool call or error, just return the state
      return {
        messages: state.messages
      };
    } catch (error) {
      console.error('Error in agent:', error);
      
      return {
        messages: state.messages,
        error: error instanceof Error ? error.message : 'Unknown error in agent execution'
      };
    }
  };
}

/**
 * Create a streaming version of the agent that sends incremental responses via SSE
 */
export function createStreamingAgent(claudeClient: ClaudeClient, tools: AgentTool[] = []) {
  /**
   * Run the agent with the provided input and stream the response
   */
  return async (input: string, context: AgentContext, res: Response): Promise<void> => {
    try {
      // Initialize messages with system prompt and user input
      const messages: AgentMessage[] = [
        createSystemMessage(),
        {
          role: AgentMessageRole.USER,
          content: input
        }
      ];
      
      // Convert messages to Claude format (only user and assistant messages)
      const claudeMessages = convertToClaudeMessages(messages);
      
      // Prepare system prompt with context information
      let systemPrompt = DEFAULT_SYSTEM_PROMPT;
      
      // Add context information if available
      if (context) {
        const ctx = context;
        let contextInfo = '';
        
        if (ctx.contextType === 'document' && ctx.documentId) {
          contextInfo = `\nCurrent document context:
- Document ID: ${ctx.documentId}
- Document title: ${ctx.documentTitle || 'Untitled'}
${ctx.documentContent ? `- Document content preview: ${ctx.documentContent.substring(0, 200)}...` : ''}`;
        } else if (ctx.contextType === 'project' && ctx.projectId) {
          contextInfo = `\nCurrent project context:
- Project ID: ${ctx.projectId}
- Project name: ${ctx.projectName || 'Unnamed Project'}`;
        }
        
        systemPrompt += contextInfo;
      }
      
      // Add tool descriptions if available
      if (tools && tools.length > 0) {
        let toolsInfo = '\n\nAvailable tools:\n';
        
        tools.forEach(tool => {
          toolsInfo += `- ${tool.name}: ${tool.description}\n`;
        });
        
        systemPrompt += toolsInfo;
      }
      
      // Create a streaming response
      const stream = await claudeClient.createStreamingMessage(claudeMessages, {
        systemPrompt,
        temperature: 0.7,
      });
      
      // Initialize response object
      let fullResponse = '';
      let currentToolCall: { name: string, args: Record<string, any> } | null = null;
      
      // Process the stream
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          try {
            // Process event data from Claude stream
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              // Only process data lines
              if (!line.startsWith('data:')) {
                continue;
              }
              
              // Remove the 'data: ' prefix
              const data = line.slice(5).trim();
              
              // Skip empty data
              if (!data || data === '[DONE]') {
                continue;
              }
              
              try {
                const parsedData = JSON.parse(data);
                
                // Claude sends content delta events
                if (parsedData.type === 'content_block_delta') {
                  const textDelta = parsedData.delta?.text || '';
                  
                  // Send token chunk to client
                  sendTokenChunk(res, textDelta);
                  
                  // Append to full response
                  fullResponse += textDelta;
                  
                  // Check for tool calls in the accumulated response
                  if (!currentToolCall) {
                    const toolCallRegex = /\{\{([^}]+)\}\}/g;
                    const match = toolCallRegex.exec(fullResponse);
                    
                    if (match) {
                      try {
                        const toolCallText = match[1];
                        const colonIndex = toolCallText.indexOf(':');
                        
                        if (colonIndex > 0) {
                          const toolName = toolCallText.substring(0, colonIndex).trim();
                          const argsText = toolCallText.substring(colonIndex + 1).trim();
                          
                          // Find the tool
                          const tool = tools.find(t => t.name === toolName);
                          
                          if (tool) {
                            // Parse arguments
                            let args: Record<string, any> = {};
                            
                            try {
                              args = JSON.parse(argsText);
                            } catch (e) {
                              // Simple parsing for key-value pairs if JSON parsing fails
                              const keyValuePairs = argsText.split(',').map(pair => pair.trim());
                              keyValuePairs.forEach(pair => {
                                const [key, value] = pair.split('=').map(part => part.trim());
                                if (key) {
                                  args[key] = value;
                                }
                              });
                            }
                            
                            // Store the tool call
                            currentToolCall = {
                              name: toolName,
                              args
                            };
                            
                            // Send tool call event to client
                            sendToolCall(res, toolName, args);
                            
                            // Execute the tool
                            try {
                              const result = await tool.handler(args, context);
                              
                              // Send the result as a complete event
                              sendComplete(res, { 
                                toolName, 
                                result,
                                fullResponse 
                              });
                              
                              return;
                            } catch (error) {
                              sendError(res, `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                              return;
                            }
                          }
                        }
                      } catch (e) {
                        console.error('Error parsing tool call:', e);
                      }
                    }
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          } catch (e) {
            console.error('Error processing chunk:', e);
          }
        }
        
        // Send complete event when done
        sendComplete(res, { fullResponse });
      } catch (error) {
        console.error('Error reading stream:', error);
        sendError(res, error instanceof Error ? error.message : 'Unknown streaming error');
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in streaming agent:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error in agent execution');
    }
  };
} 