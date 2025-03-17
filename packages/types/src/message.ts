/**
 * Message type definitions
 */

export interface Message {
  id: string;
  userId: string;
  senderType: 'user' | 'ai';
  content: string;
  contextType: string;
  contextId: string;
  detectedIntent?: string[];
  hasProposedChanges: boolean;
  proposedEntityChanges?: Record<string, unknown>;
  displayThreadId?: string;
  replyToMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTag {
  id: string;
  messageId: string;
  tag: string;
  createdBy: 'user' | 'ai' | 'system';
}

export interface MessageReference {
  id: string;
  messageId: string;
  entityType: string;
  entityId: string;
  referenceType: 'mentions' | 'modifies' | 'creates' | 'analyzes';
} 