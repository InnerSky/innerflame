// AI-related types for the system

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  capabilities: string[];
}

export type AgentType = 'canvas_strategy' | 'section_writer' | 'editor' | 'supervisor';

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AISession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  contextEntities: string[];
  state: Record<string, any>;
}

export interface AIMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AIAction {
  id: string;
  sessionId: string;
  agentId: string;
  toolName: string;
  parameters: Record<string, any>;
  result?: any;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
}
