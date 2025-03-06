import { Json } from "@/types/supabase";

// Core domain models
export interface Document {
  id: string;
  title: string;
  content: string;
  entityType: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  metadata?: Record<string, any>;
  
  // Version-related fields
  currentVersionId?: string;
  versionNumber?: number;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  entityId: string;
  versionNumber: number;
  content: {
    title: string;
    content: string;
  };
  createdAt: Date;
  isCurrent: boolean;
  versionType: string;
  baseVersionId?: string;
  significance?: string;
  userLabel?: string;
  changes?: Record<string, any>;
}

// Content structure inside full_content JSON
export interface DocumentContent {
  title: string;
  content: string;
}

// UI-specific types
export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';
export type SortDirection = 'asc' | 'desc'; 