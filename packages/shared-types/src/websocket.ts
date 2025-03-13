// WebSocket message types based on project requirements

/**
 * Message Types enum for WebSocket communication
 */
export enum MessageType {
  AUTH = 'auth',
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',
  USER_PROMPT = 'user_prompt',
  STREAMING_RESPONSE = 'streaming_response',
  AI_RESPONSE = 'ai_response',
  AI_EDIT_PROPOSAL = 'ai_edit_proposal',
  ERROR = 'error',
  CONNECTION_STATUS = 'connection_status',
  ECHO = 'echo',
  ECHO_RESPONSE = 'echo_response'
}

/**
 * Connection status for WebSocket clients
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error'
}

// Base message interface
export interface BaseMessage {
  type: string;
  sessionId?: string;
  messageId: string;
}

// Authentication Messages
export interface AuthMessage extends BaseMessage {
  type: MessageType.AUTH;
  token: string;
}

export interface AuthSuccessMessage extends BaseMessage {
  type: MessageType.AUTH_SUCCESS;
  sessionId: string;
  content: string;
}

export interface AuthErrorMessage extends BaseMessage {
  type: MessageType.AUTH_ERROR;
  content: string;
}

// Error Message
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  content: string;
}

// Connection Status Message
export interface ConnectionStatusMessage extends BaseMessage {
  type: MessageType.CONNECTION_STATUS;
  content: string;
}

// Echo Messages (for testing)
export interface EchoMessage extends BaseMessage {
  type: MessageType.ECHO;
  payload: any;
}

export interface EchoResponseMessage extends BaseMessage {
  type: MessageType.ECHO_RESPONSE;
  content: any;
}

// AI Interaction Messages
export interface UserPromptMessage extends BaseMessage {
  type: MessageType.USER_PROMPT;
  entityId?: string;
  content: string;
}

export interface StreamingResponseMessage extends BaseMessage {
  type: MessageType.STREAMING_RESPONSE;
  content: string;
  isComplete: boolean;
}

export interface AIResponseMessage extends BaseMessage {
  type: MessageType.AI_RESPONSE;
  content: string;
  referencedMessages: string[];
}

export interface AIEditProposalMessage extends BaseMessage {
  type: MessageType.AI_EDIT_PROPOSAL;
  entityId: string;
  baseVersionId: string;
  changes: {
    insertions: Array<{position: number, content: string}>;
    deletions: Array<{start: number, end: number}>;
    replacements: Array<{start: number, end: number, content: string}>;
  };
  reasoning: string;
}

/**
 * Session state for managing WebSocket connections
 */
export interface SessionState {
  sessionId: string;
  userId: string;
  activeEntityId?: string;
  messageHistory: BaseMessage[];
  lastActivity: Date;
  isActive: boolean;
  connectionCount?: number;
}
