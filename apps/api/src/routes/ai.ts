import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Request, Response } from 'express';
import { 
  initializeClaudeClient, 
  initializeLLMProvider,
  initializeLLMAdapter,
  createAgent, 
  createStreamingAgent 
} from '../services/ai/agent.js';
import { createDocumentUpdateTool } from '@innerflame/ai-tools/src/tools/documentUpdate.js';
import { AgentContext } from '@innerflame/ai-tools/src/langgraph/types.js';

// Initialize tRPC
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

// Initialize LLM provider and adapter
const llmProvider = initializeLLMProvider();
const llmAdapter = initializeLLMAdapter(llmProvider);

// Legacy: Initialize Claude client
// const claudeClient = initializeClaudeClient();

// Create tools
const tools = [createDocumentUpdateTool()];

// Create the agent with tools
const agent = createAgent(llmAdapter, tools);

// Create the streaming agent with tools
const streamingAgent = createStreamingAgent(llmAdapter, tools);

// AI Router
export const aiRouter = router({
  health: publicProcedure
    .query(() => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ai-assistant'
      };
    }),
  
  askQuestion: publicProcedure
    .input(z.object({
      message: z.string(),
      contextType: z.enum(['document', 'project', 'general']),
      userId: z.string(),
      documentId: z.string().optional(),
      documentTitle: z.string().optional(),
      documentContent: z.string().optional(),
      projectId: z.string().optional(),
      projectName: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Create context from input
      const context: AgentContext = {
        userId: input.userId,
        contextType: input.contextType,
        documentId: input.documentId,
        documentTitle: input.documentTitle,
        documentContent: input.documentContent,
        projectId: input.projectId,
        projectName: input.projectName
      };
      
      try {
        // Call the agent
        const result = await agent(input.message, context);
        
        // Format the response
        return {
          success: true,
          messages: result.messages,
          result: result.result
        };
      } catch (error) {
        console.error('Error in askQuestion:', error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          messages: []
        };
      }
    })
});

// Define the streaming endpoint handler (outside of tRPC)
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
    chatHistory
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
    chatHistory // Pass chat history to context
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