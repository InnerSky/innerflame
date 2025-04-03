import { Json, Tables } from "@innerflame/types";

// Available document types
export enum DocumentType {
  UserDocument = 'user_document',
  Canvas = 'canvas',
  Project = 'project',
  JournalEntry = 'journal_entry',
  FuturePressRelease = 'future_press_release',
  LeanCanvas = 'lean_canvas',
  SalesPage = 'sales_page'
}

// Content format types
export enum ContentFormat {
  Markdown = 'markdown',
  JSON = 'json',
  HTML = 'html'
}

// Structured metadata type for better type safety
export interface DocumentMetadata {
  tags?: string[];
  category?: string;
  contentFormat?: ContentFormat; // Added content format to metadata
  [key: string]: any; // Allow for additional properties
}

// Core domain models
export interface Document extends Omit<Tables<"entities">, 
  "entity_type" | "content" | "created_at" | "updated_at" | "metadata"> {
  entityType: DocumentType;  // renamed from entity_type and typed as enum
  content: string;     // changed from string | null to string
  createdAt: Date;     // converted from string to Date
  updatedAt: Date;     // converted from string to Date
  metadata?: DocumentMetadata; // typed more specifically
  
  // Version-related fields
  currentVersionId?: string;
  versionNumber?: number;
  versions?: DocumentVersion[];
}

// Content structure inside full_content JSON
export interface DocumentContent {
  title: string;
  content: string;
}

export interface DocumentVersion extends Omit<Tables<"entity_versions">,
  "full_content" | "created_at" | "is_current" | "entity_type" | "changes" | "approval_status"> {
  content: DocumentContent;    // structured version of full_content
  createdAt: Date;             // converted from string to Date
  isCurrent: boolean;          // renamed and non-nullable
  entityType: DocumentType;    // renamed from entity_type and typed as enum
  changes?: Record<string, unknown>; // typed more specifically
  approval_status?: string | null;   // Added to support the approval workflow
}

// UI-specific types
export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';
export type SortDirection = 'asc' | 'desc'; 