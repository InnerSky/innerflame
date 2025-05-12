/**
 * Message type definitions
 */
import { Tables } from "./supabase.js";

/**
 * Message context types
 */
export enum MessageContextType {
  None = 'none',
  Project = 'project',
  Document = 'document',
  Ask = 'ask',
  Reflect = 'reflect',
  Capture = 'capture'
}

/**
 * Message sender types
 */
export enum MessageSenderType {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

/**
 * Core Message interface extending the Supabase database table type
 */
export interface Message extends Omit<Tables<"messages">, 
  "created_at" | "content_embedding"> {
  createdAt: Date; // converted from string to Date
  contentEmbedding?: string; // optional embedding
  detectedIntent?: string[]; // optional intent detection
  isEdited?: boolean; // flag to indicate the message has been edited
  updatedAt?: Date; // when the message was last updated
}

/**
 * Parameters for creating a new message
 */
export interface CreateMessageParams {
  content: string;
  userId: string;
  senderType: MessageSenderType;
  contextType?: MessageContextType;
  contextId?: string;
  contextEntityVersionId?: string;
  replyToMessageId?: string;
}

/**
 * Filtering options for loading messages
 */
export interface MessageFilter {
  contextType?: MessageContextType;
  contextId?: string;
  userId?: string;
  limit?: number;
  replyToMessageId?: string; // Used for threading
}

/**
 * Tag for associating metadata with messages
 */
export interface MessageTag {
  id: string;
  messageId: string;
  tag: string;
  createdBy: 'user' | 'ai' | 'system';
}

/**
 * Reference between messages and entities
 */
export interface MessageReference {
  id: string;
  messageId: string;
  entityType: string;
  entityId: string;
  referenceType: 'mentions' | 'modifies' | 'creates' | 'analyzes';
}

/**
 * Transform from database row to domain model
 */
export function mapToMessage(row: Tables<"messages">): Message {
  // Convert created_at to Date object
  const createdAt = row.created_at ? new Date(row.created_at) : new Date();
  
  // Set default values for fields that may not exist in the database
  const updatedAt = undefined;
  const isEdited = false;
  
  return {
    ...row,
    createdAt,
    updatedAt,
    contentEmbedding: row.content_embedding || undefined,
    detectedIntent: undefined, // Field no longer exists in schema
    isEdited
  };
}

/**
 * Helper to determine message context from document/project selection
 */
export function determineMessageContext(
  selectedDocument: any | null,
  selectedProjectId: string | null
): { contextType: MessageContextType; contextId: string | null } {
  if (selectedDocument) {
    return { 
      contextType: MessageContextType.Document, 
      contextId: selectedDocument.id 
    };
  } else if (selectedProjectId) {
    return { 
      contextType: MessageContextType.Project, 
      contextId: selectedProjectId 
    };
  } else {
    return { 
      contextType: MessageContextType.None, 
      contextId: null 
    };
  }
} 