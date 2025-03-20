import { StateGraph, END } from '@langchain/langgraph';
import { AgentState, AgentMessage, AgentMessageRole, AgentContext, AgentTool, AgentOutput } from './types.js';
import { ClaudeClient, ClaudeMessage, ClaudeRole } from '../claude/client.js';

/**
 * Basic LangGraph agent for InnerFlame
 * 
 * This implements a minimal LangGraph agent for document interactions.
 */

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant for a document editing application called InnerFlame.
Your primary responsibility is to help users with their documents and projects.

When helping users:
- Provide concise, relevant information
- If you need to reference a document, use the tools provided
- Only use the tools when necessary
- Respond in a friendly, professional tone
- For document edits, use the updateDocument tool`;

// Create system message
const createSystemMessage = (customPrompt?: string): AgentMessage => ({
  role: AgentMessageRole.SYSTEM,
  content: customPrompt || DEFAULT_SYSTEM_PROMPT
});

// Convert agent messages to Claude format
const convertToClaudeMessages = (messages: AgentMessage[]): ClaudeMessage[] => {
  return messages.filter(msg => 
    msg.role === AgentMessageRole.USER || 
    msg.role === AgentMessageRole.ASSISTANT ||
    msg.role === AgentMessageRole.SYSTEM
  ).map(msg => ({
    role: msg.role as ClaudeRole,
    content: msg.content
  }));
};

/**
 * Node to process user input and generate assistant response
 */
const createProcessNode = (claudeClient: ClaudeClient) => {
  return async (state: AgentState): Promise<AgentOutput> => {
    try {
      // Get the last message from the user
      const lastMessage = state.messages[state.messages.length - 1];
      
      // If not a user message, just return the state
      if (lastMessage.role !== AgentMessageRole.USER) {
        return { 
          messages: state.messages,
          nextStep: END
        };
      }
      
      // Convert state messages to Claude format
      const claudeMessages = convertToClaudeMessages(state.messages);
      
      // Add context information to system prompt if available
      let systemPrompt = DEFAULT_SYSTEM_PROMPT;
      
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
            let args = {};
            
            try {
              args = JSON.parse(argsString);
            } catch (e) {
              // Simple parsing for key-value pairs if JSON parsing fails
              const keyValuePairs = argsString.split(',').map(pair => pair.trim());
              keyValuePairs.forEach(pair => {
                const [key, value] = pair.split('=').map(part => part.trim());
                args[key] = value;
              });
            }
            
            // Update the assistant message with the tool call
            assistantMessage.toolCall = {
              name: trimmedToolName,
              args
            };
            
            return {
              messages: [...state.messages, assistantMessage],
              nextStep: 'execute_tool'
            };
          }
        } catch (e) {
          console.error('Error parsing tool call:', e);
        }
      }
      
      // If no tool call or error, just return the assistant message
      return {
        messages: [...state.messages, assistantMessage],
        nextStep: END
      };
    } catch (error) {
      console.error('Error in process node:', error);
      
      return {
        messages: state.messages,
        error: error instanceof Error ? error.message : 'Unknown error in processing',
        nextStep: END
      };
    }
  };
};

/**
 * Node to execute a tool call
 */
const createExecuteToolNode = () => {
  return async (state: AgentState): Promise<AgentOutput> => {
    try {
      // Get the last message from the assistant
      const lastMessage = state.messages[state.messages.length - 1];
      
      // If not an assistant message or no tool call, just return the state
      if (lastMessage.role !== AgentMessageRole.ASSISTANT || !lastMessage.toolCall) {
        return { 
          messages: state.messages,
          nextStep: END
        };
      }
      
      const { name: toolName, args } = lastMessage.toolCall;
      
      // Find the tool
      const tool = state.tools?.find(t => t.name === toolName);
      
      if (!tool || !state.context) {
        return {
          messages: state.messages,
          error: `Tool '${toolName}' not found or context missing`,
          nextStep: END
        };
      }
      
      // Execute the tool
      const result = await tool.handler(args, state.context);
      
      // Create tool result message
      const toolResultMessage: AgentMessage = {
        role: AgentMessageRole.TOOL_RESULT,
        content: JSON.stringify(result),
        toolResult: result
      };
      
      return {
        messages: [...state.messages, toolResultMessage],
        lastToolResult: result,
        nextStep: 'process' // Go back to process node to continue the conversation
      };
    } catch (error) {
      console.error('Error in execute tool node:', error);
      
      // Create error message
      const errorMessage: AgentMessage = {
        role: AgentMessageRole.TOOL_RESULT,
        content: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
        toolResult: { error: true, message: error instanceof Error ? error.message : 'Unknown error' }
      };
      
      return {
        messages: [...state.messages, errorMessage],
        error: error instanceof Error ? error.message : 'Unknown error in tool execution',
        nextStep: 'process' // Go back to process node to handle the error
      };
    }
  };
};

/**
 * Create a LangGraph agent with the provided Claude client and tools
 */
export function createAgent(claudeClient: ClaudeClient, tools: AgentTool[] = []) {
  // Create the graph
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: [],
        validator: (messages: AgentMessage[]) => messages
      },
      context: {
        value: undefined,
      },
      tools: {
        value: tools,
      },
      currentStep: {
        value: undefined,
      },
      lastToolResult: {
        value: undefined,
      },
      error: {
        value: undefined,
      }
    }
  });
  
  // Add nodes
  workflow.addNode('process', createProcessNode(claudeClient));
  workflow.addNode('execute_tool', createExecuteToolNode());
  
  // Add edges
  workflow.addEdge('process', 'execute_tool');
  workflow.addEdge('execute_tool', 'process');
  
  // Set the entrypoint
  workflow.setEntryPoint('process');
  
  // Compile the graph
  const app = workflow.compile();
  
  /**
   * Run the agent with the provided input
   */
  return async (input: string, context: AgentContext): Promise<AgentOutput> => {
    // Create initial state
    const initialState: AgentState = {
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
    
    // Run the graph
    const result = await app.invoke(initialState);
    
    return {
      messages: result.messages,
      result: result.lastToolResult
    };
  };
} 