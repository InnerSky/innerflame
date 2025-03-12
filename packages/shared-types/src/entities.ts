// This file contains types related to entities in the system

export interface Entity {
  id: string;
  user_id: string;
  title: string;
  entity_type: string;
  content?: string;
  metadata?: Record<string, any>;
  parent_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EntityVersion {
  id: string;
  entity_id: string;
  version_number: number;
  content: string;
  metadata?: Record<string, any>;
  created_at: Date;
  created_by: string;
}

export interface EntityComment {
  id: string;
  entity_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: Date;
  updated_at: Date;
}

export type EntityType = 'canvas' | 'document' | 'section' | 'note';
