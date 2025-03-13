// This is the entry point for the shared-types package
// It exports all types from the various domain files

// Export all domain types
export * from './entities';
export * from './websocket';
export * from './ai';
export * from './supabase';

// Placeholder types that will be expanded
export interface Entity {
  id: string;
  user_id: string;
  title: string;
  entity_type: string;
  content?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EntityVersion {
  id: string;
  entity_id: string;
  version_number: number;
  content: string;
  created_at: Date;
  created_by: string;
}
