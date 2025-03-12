// WebSocket message types based on project requirements

export interface BaseMessage {
  type: string;
  sessionId: string;
  messageId: string;
}

export interface UserPromptMessage extends BaseMessage {
  type: 'user_prompt';
  entityId: string;
  content: string;
}

export interface StreamingResponseMessage extends BaseMessage {
  type: 'streaming_response';
  content: string;
  isComplete: boolean;
}

export interface AIResponseMessage extends BaseMessage {
  type: 'ai_response';
  content: string;
  referencedMessages: string[];
}

export interface AIEditProposalMessage extends BaseMessage {
  type: 'ai_edit_proposal';
  entityId: string;
  baseVersionId: string;
  changes: {
    insertions: Array<{position: number, content: string}>;
    deletions: Array<{start: number, end: number}>;
    replacements: Array<{start: number, end: number, content: string}>;
  };
  reasoning: string;
}

export interface SessionState {
  sessionId: string;
  userId: string;
  activeEntityId?: string;
  messageHistory: BaseMessage[];
  lastActivity: Date;
  isActive: boolean;
}
