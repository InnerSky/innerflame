import { 
  AgentState, 
  AgentMessage, 
  AgentMessageRole, 
  AgentContext, 
  AgentTool, 
  AgentOutput 
} from '@innerflame/ai-tools/src/langgraph/types.js';
import { 
  // New imports
  LLMProvider,
  LLMAdapter,
  createLLMAdapter,
  initializeProviderFromEnv
} from '@innerflame/ai-tools/src/index.js';
import { Response, Request } from 'express';
import { 
  sendTokenChunk, 
  sendToolCall, 
  sendComplete, 
  sendError 
} from '../../controllers/sse.js';
// Import the new prompt system
import { createSystemPrompt, ContextType, PlaybookType } from '../prompts/index.js';

/**
 * LangGraph agent implementation for InnerFlame API service
 * 
 * This implements a minimal agent for document interactions.
 */

/**
 * Create system message using our prompt system
 */
const createSystemMessage = (customPrompt?: string, context: AgentContext = { userId: 'default', contextType: 'general' }): AgentMessage => ({
  role: AgentMessageRole.SYSTEM,
  content: customPrompt || getSystemPromptForContext(context)
});

/**
 * Get the appropriate system prompt based on context
 * 
 * Uses our configuration-based prompt system
 */
function getSystemPromptForContext(
  context: AgentContext, 
  customPrompt?: string, 
  shouldLog: boolean = false,
  playbookType: keyof typeof PlaybookType = PlaybookType.LEAN_CANVAS_CHAPTER1
): string {
  // If a custom prompt is provided, use it directly
  if (customPrompt) {
    return customPrompt;
  }
  
  // Create a configuration object based on the context
  const promptConfig = {
    // Pass the context type
    contextType: context.contextType,
    
    // Document capabilities
    enableDocumentEditing: context.contextType === 'document',
    documentId: context.documentId,
    documentTitle: context.documentTitle,
    documentContent: context.documentContent,
    
    // Enable playbook capability with specified type
    enablePlaybook: true,
    playbookType
  };
  
  // Log what playbook is being used
  console.log(`Using playbook: ${promptConfig.playbookType}`);
  
  // Use our new configuration-based system prompt
  const fullPrompt = createSystemPrompt(promptConfig);
  
  return fullPrompt;
}

/**
 * Initialize the LLM provider using environment variables
 */
export function initializeLLMProvider(): LLMProvider {
  return initializeProviderFromEnv();
}

/**
 * Initialize the LLM adapter using the provided LLM provider
 */
export function initializeLLMAdapter(provider: LLMProvider): LLMAdapter {
  return createLLMAdapter(provider);
}

/**
 * Create a simplified agent with the provided LLM adapter and tools
 */
export function createAgent(
  llmAdapter: LLMAdapter, 
  tools: AgentTool[] = [],
  playbookType: keyof typeof PlaybookType = PlaybookType.LEAN_CANVAS_CHAPTER1
) {
  
  /**
   * Run the agent with the provided input
   */
  return async (input: string, context: AgentContext): Promise<AgentOutput> => {
    // Initialize state
    let state: AgentState = {
      messages: [
        createSystemMessage(undefined, context),
      ],
      context,
      tools,
    };
    
    // Add chat history if available
    if (context.chatHistory && context.chatHistory.length > 0) {
      console.log(`Adding ${context.chatHistory.length} messages from chat history`);
      
      // Convert chat history to AgentMessage format and filter out empty messages
      const historyMessages = context.chatHistory
        .filter(msg => msg.content && msg.content.trim() !== '') // Filter out empty messages
        .map(msg => {
          const role = msg.sender_type === 'user' 
            ? AgentMessageRole.USER 
            : AgentMessageRole.ASSISTANT;
          
          return {
            role,
            content: msg.content || '' // This fallback should never trigger now due to the filter
          } as AgentMessage;
        });
      
      console.log(`After filtering, adding ${historyMessages.length} valid messages from chat history`);
      
      // Add history messages
      state.messages.push(...historyMessages);
    }
    
    // Verify user input is not empty
    if (!input || input.trim() === '') {
      throw new Error('User input cannot be empty');
    }
    
    // Add the current user message
    state.messages.push({
      role: AgentMessageRole.USER,
      content: input
    });
    
    // Process the user input
    try {
      // Get the system message and user message
      const systemMessage = state.messages.find(m => m.role === AgentMessageRole.SYSTEM);
      
      if (!systemMessage) {
        throw new Error('No system message found');
      }
      
      // Get the appropriate system prompt for this context
      let systemPrompt = getSystemPromptForContext(context, undefined, false, playbookType);
      
      // Add tool descriptions if available
      if (state.tools && state.tools.length > 0) {
        let toolsInfo = '\n\nAvailable tools:\n';
        
        state.tools.forEach(tool => {
          toolsInfo += `- ${tool.name}: ${tool.description}\n`;
        });
        
        systemPrompt += toolsInfo;
      }
      
      // Generate a response using the LLM adapter
      const response = await llmAdapter.sendMessage(state.messages, {
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
              // Ensure state.context is not undefined
              if (!state.context) {
                throw new Error('Context is required for tool execution');
              }
              
              const result = await tool.handler(args, state.context);
              
              // Update the message with the result
              assistantMessage.toolResult = {
                name: trimmedToolName,
                result
              };
              
              return {
                messages: state.messages,
                result
              };
            } catch (e) {
              console.error(`Error executing tool ${trimmedToolName}:`, e);
              
              // Return error as result
              return {
                messages: state.messages,
                error: e instanceof Error ? e.message : 'Unknown tool execution error'
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
export function createStreamingAgent(
  llmAdapter: LLMAdapter, 
  tools: AgentTool[] = [],
  playbookType: keyof typeof PlaybookType = PlaybookType.LEAN_CANVAS_CHAPTER1
) {
  /**
   * Run the agent with the provided input and stream the response
   */
  return async (input: string, context: AgentContext, req: Request, res: Response): Promise<void> => {
    try {
      // Ensure we have the correct context information in the request body for later use
      if (req.body) {
        // Make sure contextType and contextId are properly set in the request body
        req.body.contextType = context.contextType;
        req.body.contextId = context.documentId || context.projectId;
        
        // Log the context information for debugging
        console.log(`Agent using contextType=${context.contextType}, contextId=${context.documentId || context.projectId}`);
      }
      
      // Initialize messages with system prompt and user input
      const messages: AgentMessage[] = [
        createSystemMessage(undefined, context),
      ];
      
      // Add chat history if available
      if (context.chatHistory && context.chatHistory.length > 0) {
        console.log(`Adding ${context.chatHistory.length} messages from chat history`);
        
        // Convert chat history to AgentMessage format and filter out messages with empty content
        const historyMessages = context.chatHistory
          .filter(msg => msg.content && msg.content.trim() !== '') // Filter out empty messages
          .map(msg => {
            const role = msg.sender_type === 'user' 
              ? AgentMessageRole.USER 
              : AgentMessageRole.ASSISTANT;
            
            return {
              role,
              content: msg.content || '' // This fallback should never trigger now due to the filter
            } as AgentMessage;
          });
        
        console.log(`After filtering, adding ${historyMessages.length} valid messages from chat history`);
        
        // Add history messages before the current user message
        messages.push(...historyMessages);
      }
      
      // Add the current user message (verify it's not empty)
      if (!input || input.trim() === '') {
        throw new Error('User input cannot be empty');
      }
      
      messages.push({
        role: AgentMessageRole.USER,
        content: input
      });
      
      // Get the appropriate system prompt for this context
      let systemPrompt = getSystemPromptForContext(context, undefined, true, playbookType);
      
      // Add tool descriptions if available
      if (tools && tools.length > 0) {
        let toolsInfo = '\n\nAvailable tools:\n';
        
        tools.forEach(tool => {
          toolsInfo += `- ${tool.name}: ${tool.description}\n`;
        });
        
        systemPrompt += toolsInfo;
      }
      
      // Debug log to track which prompt is being used
      console.log(`Using system prompt for ${context.contextType} context with playbook: ${playbookType}`);
      
      // Create a streaming response
      const stream = await llmAdapter.streamMessage(messages, {
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
            // Process event data from LLM stream
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
                
                // LLM sends content delta events
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
                              // Ensure state.context is not undefined
                              if (!context) {
                                throw new Error('Context is required for tool execution');
                              }
                              
                              const result = await tool.handler(args, context);
                              
                              // Send the result as a complete event
                              await sendComplete(req, res, { 
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
        await sendComplete(req, res, { fullResponse });
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