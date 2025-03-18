import { Tables } from "@/types/supabase";

// Message context types
export enum MessageContextType {
  None = 'none',
  Project = 'project',
  Document = 'document'
}

// Sender types
export enum MessageSenderType {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

// Core Message model extending Supabase tables type
export interface Message extends Omit<Tables<"messages">,
  "created_at" | "content_embedding" | "detected_intent" | "proposed_entity_changes"> {
  createdAt: Date; // converted from string to Date
  contentEmbedding?: string; // optional embedding
  detectedIntent?: string[]; // optional intent detection
  proposedChanges?: Record<string, any>; // optional changes
}

// Type for creating a new message
export interface CreateMessageParams {
  content: string;
  userId: string;
  senderType: MessageSenderType;
  contextType?: MessageContextType;
  contextId?: string;
  replyToMessageId?: string;
  displayThreadId?: string;
}

// Type for message filtering
export interface MessageFilter {
  contextType?: MessageContextType;
  contextId?: string;
  userId?: string;
  limit?: number;
  threadId?: string;
}

// Transform from database row to domain model
export function mapToMessage(row: Tables<"messages">): Message {
  return {
    ...row,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    contentEmbedding: row.content_embedding || undefined,
    detectedIntent: row.detected_intent || undefined,
    proposedChanges: typeof row.proposed_entity_changes === 'object' ? row.proposed_entity_changes as Record<string, any> : undefined
  };
}

// Helper to determine the current context type and ID
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