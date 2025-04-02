import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Request, Response } from 'express';
import { 
  initializeLLMProvider,
  initializeLLMAdapter,
  createAgent, 
  createStreamingAgent 
} from '../services/ai/index.js';
import { createDocumentUpdateTool } from '@innerflame/ai-tools/src/tools/documentUpdate.js';
import { AgentContext } from '@innerflame/ai-tools/src/langgraph/types.js';
import { PlaybookType } from '../services/prompts/index.js';
import { initSSE } from '../controllers/sse.js';

// Initialize tRPC
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

// Initialize LLM provider and adapter
const llmProvider = initializeLLMProvider();
const llmAdapter = initializeLLMAdapter(llmProvider);

// Create tools
const tools = [createDocumentUpdateTool()];

// Create the specialized agents
const orchestratorAgent = createAgent(llmAdapter, tools, PlaybookType.ORCHESTRATOR);
const generatorAgent = createStreamingAgent(llmAdapter, tools, PlaybookType.GENERATOR);
const mentorAgent = createStreamingAgent(llmAdapter, tools, PlaybookType.MENTOR);
const webSearchAgent = createStreamingAgent(llmAdapter, tools, PlaybookType.WEB_SEARCH);

// Legacy agent for backward compatibility (uses LEAN_CANVAS_CHAPTER1)
const streamingAgent = createStreamingAgent(llmAdapter, tools);

// Define the router
export const aiRouter = router({
  // Example endpoint to send a message to the agent
  sendMessage: publicProcedure
    .input(z.object({
      message: z.string(),
      contextType: z.enum(['document', 'project', 'general']),
      userId: z.string()
    }))
    .mutation(async ({ input }) => {
      // Create context from input
      const context: AgentContext = {
        userId: input.userId,
        contextType: input.contextType as 'document' | 'project' | 'general'
      };
      
      // Call the agent
      const response = await orchestratorAgent(input.message, context);
      
      return response;
    })
});

// Define the orchestrator endpoint handler
export async function handleOrchestratorRequest(req: Request, res: Response): Promise<void> {
  // Set headers for streaming (in case the client is attempting to read the response as a stream)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx proxies
  
  const { 
    message, 
    contextType, 
    userId, 
    documentId, 
    documentTitle, 
    documentContent, 
    projectId, 
    projectName,
    chatHistory,
    contextEntityVersionId
  } = req.body;
  
  // Validate required fields
  if (!message || !contextType || !userId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  // Create context from request body
  const context: AgentContext = {
    userId,
    contextType: contextType as 'document' | 'project' | 'general',
    documentId,
    documentTitle,
    documentContent,
    projectId,
    projectName,
    chatHistory,
    contextEntityVersionId
  };
  
  try {
    // Initialize the SSE connection
    initSSE(res);
    
    // Call the orchestrator agent (non-streaming)
    console.log('Calling orchestrator agent to determine which specialized agent to use');
    const response = await orchestratorAgent(message, context);
    
    // Extract the agent decision
    const decision = response.messages[response.messages.length - 1].content;
    console.log('Orchestrator decision:', decision);
    
    const match = decision.match(/<call_agent>(\w+)<\/call_agent>/);
    
    if (match && match[1]) {
      const agentType = match[1];
      console.log(`Orchestrator selected agent: ${agentType}`);
      
      // Select the appropriate streaming agent
      let selectedAgent;
      switch (agentType) {
        case 'generator_agent':
          console.log('Using Generator Agent with playbook:', PlaybookType.GENERATOR);
          selectedAgent = generatorAgent;
          break;
        case 'mentor_agent':
          console.log('Using Mentor Agent with playbook:', PlaybookType.MENTOR);
          selectedAgent = mentorAgent;
          break;
        case 'web_search_agent':
          console.log('Using Web Search Agent with playbook:', PlaybookType.WEB_SEARCH);
          selectedAgent = webSearchAgent;
          break;
        default:
          // Default to mentor agent if no match
          console.log(`Unknown agent type "${agentType}", falling back to Mentor Agent with playbook:`, PlaybookType.MENTOR);
          selectedAgent = mentorAgent;
      }
      
      // Call the selected streaming agent directly
      console.log(`Delegating to specialized agent for message: "${message.substring(0, 50)}..."`);
      await selectedAgent(message, context, req, res);
      console.log('Specialized agent streaming completed');
    } else {
      // Fallback to default agent if no match
      console.log('No specific agent selected in orchestrator response, using default agent with playbook:', PlaybookType.LEAN_CANVAS_CHAPTER1);
      await streamingAgent(message, context, req, res);
    }
  } catch (error) {
    console.error('Error in orchestrator request:', error);
    
    // If the headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }
}

// Define the streaming endpoint handler for specialized agents
export async function handleSpecializedAgentRequest(req: Request, res: Response): Promise<void> {
  const { 
    message, 
    contextType, 
    userId, 
    documentId, 
    documentTitle, 
    documentContent, 
    projectId, 
    projectName,
    chatHistory,
    agentType,
    contextEntityVersionId
  } = req.body;
  
  // Validate required fields
  if (!message || !contextType || !userId || !agentType) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  // Create context from request body
  const context: AgentContext = {
    userId,
    contextType: contextType as 'document' | 'project' | 'general',
    documentId,
    documentTitle,
    documentContent,
    projectId,
    projectName,
    chatHistory,
    contextEntityVersionId
  };
  
  try {
    // Select the appropriate agent based on type
    let selectedAgent;
    
    switch (agentType) {
      case 'generator_agent':
        selectedAgent = generatorAgent;
        break;
      case 'mentor_agent':
        selectedAgent = mentorAgent;
        break;
      case 'web_search_agent':
        selectedAgent = webSearchAgent;
        break;
      default:
        // Fallback to mentor agent
        selectedAgent = mentorAgent;
    }
    
    // Call the selected streaming agent
    await selectedAgent(message, context, req, res);
  } catch (error) {
    console.error('Error in specialized agent request:', error);
    
    // If the headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }
}

// Legacy stream endpoint handler (using LEAN_CANVAS_CHAPTER1)
export async function handleStreamRequest(req: Request, res: Response): Promise<void> {
  const { 
    message, 
    contextType, 
    userId, 
    documentId, 
    documentTitle, 
    documentContent, 
    projectId, 
    projectName,
    chatHistory,
    contextEntityVersionId
  } = req.body;
  
  // Validate required fields
  if (!message || !contextType || !userId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  // Create context from request body
  const context: AgentContext = {
    userId,
    contextType: contextType as 'document' | 'project' | 'general',
    documentId,
    documentTitle,
    documentContent,
    projectId,
    projectName,
    chatHistory, // Pass chat history to context
    contextEntityVersionId
  };
  
  try {
    // Call the streaming agent (this will handle the SSE connection)
    await streamingAgent(message, context, req, res);
  } catch (error) {
    console.error('Error in stream request:', error);
    
    // If the headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }
} 