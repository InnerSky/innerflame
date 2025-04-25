import { User } from '@supabase/supabase-js';

export type EventCategory = 
  | 'navigation' 
  | 'interaction' 
  | 'authentication' 
  | 'document' 
  | 'content' 
  | 'feature_usage'
  | 'error'
  | 'performance';

export type EventAction = string;

export interface UserEventData {
  // Flexible JSON data structure to store action-specific properties
  [key: string]: any;
}

export interface UserEvent {
  id?: string;
  user_id: string;
  session_id?: string;
  event_category: EventCategory;
  event_action: EventAction;
  event_label?: string;
  event_value?: number;
  event_data?: UserEventData;
  client_timestamp: string;
  created_at?: string;
  url?: string;
  referrer?: string;
  user_agent?: string;
}

export interface EventOptions {
  label?: string;
  value?: number;
  data?: UserEventData;
} 