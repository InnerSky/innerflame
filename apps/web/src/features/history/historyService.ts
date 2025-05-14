import { supabase } from '../../lib/supabase.js';
import type { Database } from '@innerflame/types';
import { Message } from '@innerflame/types';
import { RealtimeChannel } from '@supabase/supabase-js';

// Type definition for history content format
export interface HistoryContent {
  title: string;
  overview: string;
  headline: string;
  quote: string;
  insights: string[];
  tags?: string[];
  type?: 'morning' | 'evening' | 'conversation';
}

// Type for history item with content parsed
export interface HistoryItem {
  id: string;
  content: HistoryContent;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Type for raw message from database
type DatabaseMessage = {
  id: string;
  content: string;
  content_embedding: string | null;
  context_entity_version_id: string | null;
  context_id: string | null;
  context_type: string | null;
  created_at: string | null;
  inhistory_id: string | null;
  reply_to_message_id: string | null;
  sender_type: string;
  user_id: string;
};

/**
 * Convert database message format to Message type
 */
function mapDatabaseMessageToMessage(dbMessage: DatabaseMessage): Message {
  return {
    id: dbMessage.id,
    content: dbMessage.content,
    createdAt: dbMessage.created_at ? new Date(dbMessage.created_at) : new Date(),
    user_id: dbMessage.user_id,
    sender_type: dbMessage.sender_type,
    context_id: dbMessage.context_id,
    context_type: dbMessage.context_type,
    context_entity_version_id: dbMessage.context_entity_version_id,
    reply_to_message_id: dbMessage.reply_to_message_id,
    inhistory_id: dbMessage.inhistory_id,
    isEdited: false,
    contentEmbedding: dbMessage.content_embedding || undefined
  };
}

/**
 * Fetch all history items for the current user
 * Returns history items sorted by created_at in descending order (newest first)
 */
export async function getUserHistory(): Promise<HistoryItem[]> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!sessionData.session) {
      throw new Error('No active session found');
    }
    
    const userId = sessionData.session.user.id;
    
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
    
    console.log(`Found ${data.length} history items for user ${userId}`);
    
    // Parse and validate content JSON
    return data.map(item => ({
      ...item,
      content: parseHistoryContent(item.content)
    }));
  } catch (error) {
    console.error('Error fetching user history:', error);
    throw error;
  }
}

/**
 * Fetch a single history item by ID
 */
export async function getHistoryById(historyId: string): Promise<HistoryItem> {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('id', historyId)
      .single();
      
    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
    
    return {
      ...data,
      content: parseHistoryContent(data.content)
    };
  } catch (error) {
    console.error(`Error fetching history with ID ${historyId}:`, error);
    throw error;
  }
}

/**
 * Fetch all messages linked to a specific history item
 */
export async function getMessagesForHistory(historyId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('inhistory_id', historyId)
      .order('created_at', { ascending: true });
      
    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
    
    // Convert database messages to Message type
    return (data as DatabaseMessage[]).map(mapDatabaseMessageToMessage);
  } catch (error) {
    console.error(`Error fetching messages for history ${historyId}:`, error);
    throw error;
  }
}

/**
 * Unlink all messages from a history item (set inhistory_id to null)
 */
export async function unlinkMessagesFromHistory(historyId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ inhistory_id: null })
      .eq('inhistory_id', historyId);
      
    if (error) {
      throw new Error(`Failed to unlink messages: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error unlinking messages from history ${historyId}:`, error);
    throw error;
  }
}

/**
 * Delete a history item
 */
export async function deleteHistory(historyId: string): Promise<void> {
  try {
    console.log(`Starting deletion process for history ID: ${historyId}`);
    
    // First unlink all messages from this history
    console.log(`Unlinking messages from history ID: ${historyId}`);
    await unlinkMessagesFromHistory(historyId);
    
    // Then delete the history item
    console.log(`Deleting history ID: ${historyId}`);
    const { error, data } = await supabase
      .from('history')
      .delete()
      .eq('id', historyId)
      .select();
      
    if (error) {
      console.error(`Error in delete operation:`, error);
      throw new Error(`Failed to delete history: ${error.message}`);
    }
    
    console.log(`Successfully deleted history ID: ${historyId}`, data);
  } catch (error) {
    console.error(`Error deleting history ${historyId}:`, error);
    throw error;
  }
}

/**
 * Group history items by date (YYYY-MM-DD)
 */
export function groupHistoryByDate(historyItems: HistoryItem[]): Record<string, HistoryItem[]> {
  return historyItems.reduce((groups, item) => {
    // Extract date part (YYYY-MM-DD) from created_at
    const date = new Date(item.created_at).toISOString().split('T')[0];
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);
}

/**
 * Format a date string for display (e.g., "May 15, 2024")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Parse and validate history content JSON
 */
function parseHistoryContent(content: any): HistoryContent {
  // Ensure content has the expected structure
  if (!content || typeof content !== 'object') {
    return { 
      title: 'Content Error', // Add default title
      overview: 'No content available', 
      headline: '', 
      quote: '', 
      insights: [] 
    };
  }
  
  return {
    title: content.title || 'No Title Provided', // Ensure title has a fallback
    overview: content.overview || 'No overview available',
    headline: content.headline || '', // Default to empty string if missing
    quote: content.quote || '',       // Default to empty string if missing
    insights: Array.isArray(content.insights) ? content.insights : [],
    tags: content.tags || [],
    type: content.type as HistoryContent['type'] // Assuming type might still be used
  };
}

/**
 * Subscribe to all history items for the current user
 * This sets up a real-time subscription to the history table
 * 
 * @param callback Function to call when history items are updated
 * @returns A function to unsubscribe from the updates
 */
export function subscribeToHistoryList(callback: (historyItems: HistoryItem[]) => void): () => void {
  let channel: RealtimeChannel | null = null;
  let currentItems: HistoryItem[] = [];
  
  // Get the current user's ID
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error || !session) {
      console.error('Authentication error:', error || 'No active session');
      return;
    }
    
    const userId = session.user.id;
    console.log(`Setting up history subscription for user ${userId}`);
    
    // First, get the initial data
    supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching initial history data:', error);
          return;
        }
        
        // Parse and store initial data
        currentItems = data.map(item => ({
          ...item,
          content: parseHistoryContent(item.content)
        }));
        
        // Send initial data to caller
        callback(currentItems);
      });
    
    // Then set up the subscription for changes
    channel = supabase
      .channel(`history-changes-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'history',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('History INSERT event:', payload);
        // For inserts, add the new item to our list and resort
        const newItem = {
          ...payload.new,
          content: parseHistoryContent(payload.new.content)
        } as HistoryItem;
        
        currentItems = [newItem, ...currentItems]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        callback(currentItems);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'history',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('History UPDATE event:', payload);
        // For updates, find and replace the updated item
        const updatedItem = {
          ...payload.new,
          content: parseHistoryContent(payload.new.content)
        } as HistoryItem;
        
        currentItems = currentItems.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        );
        
        callback(currentItems);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'history',
        // For DELETE events, we don't filter by user_id because the record is already gone
        // Instead, we'll check if the deleted ID exists in our current items
      }, (payload) => {
        console.log('History DELETE event received:', payload);
        
        // For deletes, check if this is a history we're currently displaying
        const deletedId = payload.old.id;
        
        // Check if we have this ID in our current items before filtering
        const hadItem = currentItems.some(item => item.id === deletedId);
        
        if (hadItem) {
          console.log(`Removing history item ${deletedId} from list`);
          currentItems = currentItems.filter(item => item.id !== deletedId);
          callback(currentItems);
        }
      })
      .subscribe((status) => {
        console.log(`History list subscription status: ${status}`);
      });
  });

  // Return unsubscribe function
  return () => {
    if (channel) {
      console.log('Unsubscribing from history list updates');
      supabase.removeChannel(channel);
    }
  };
} 