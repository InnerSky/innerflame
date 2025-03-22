import { z } from 'zod';

/**
 * LangGraph types for InnerFlame
 * 
 * These types define the structure of our LangGraph agent states and tools.
 */

// Basic agent state interface
export interface AgentState {
  messages: AgentMessage[];
  context?: AgentContext;
  tools?: AgentTool[];
  currentStep?: string;
  lastToolResult?: any;
  error?: string;
}

// Message types for agent communication
export enum AgentMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant', 
  SYSTEM = 'system',
  TOOL = 'tool',
  TOOL_RESULT = 'tool_result'
}

export interface AgentMessage {
  role: AgentMessageRole;
  content: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
  };
  toolResult?: any;
}

// Context information for the agent
export interface AgentContext {
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  projectId?: string;
  projectName?: string;
  userId: string;
  contextType: 'document' | 'project' | 'general';
  chatHistory?: any[]; // Previous messages for context
}

// Tool definition for agent
export interface AgentTool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  handler: (args: Record<string, any>, context: AgentContext) => Promise<any>;
}

// Agent output type
export interface AgentOutput {
  messages: AgentMessage[];
  nextStep?: string;
  result?: any;
  error?: string;
}

// State schemas
export const agentMessageSchema = z.object({
  role: z.enum([
    AgentMessageRole.USER,
    AgentMessageRole.ASSISTANT,
    AgentMessageRole.SYSTEM,
    AgentMessageRole.TOOL,
    AgentMessageRole.TOOL_RESULT
  ]),
  content: z.string(),
  toolCall: z.object({
    name: z.string(),
    args: z.record(z.any())
  }).optional(),
  toolResult: z.any().optional()
});

export const agentContextSchema = z.object({
  documentId: z.string().optional(),
  documentTitle: z.string().optional(),
  documentContent: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  userId: z.string(),
  contextType: z.enum(['document', 'project', 'general']),
  chatHistory: z.array(z.any()).optional()
});

export const agentStateSchema = z.object({
  messages: z.array(agentMessageSchema),
  context: agentContextSchema.optional(),
  tools: z.array(z.any()).optional(),
  currentStep: z.string().optional(),
  lastToolResult: z.any().optional(),
  error: z.string().optional()
}); 