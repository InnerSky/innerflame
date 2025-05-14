/**
 * API base URL from environment
 */
const API_URL = import.meta.env.VITE_API_URL || '';

// Import Supabase client for auth
import { supabase } from '../../lib/supabase.js';

/**
 * Create a history summary from message IDs
 * 
 * This function makes a POST request to create a new history entry
 * that summarizes the provided messages. It returns the history ID
 * which can be used to subscribe to real-time updates.
 * 
 * @param messageIds - Array of message IDs to include in the summary
 * @returns Promise resolving to the created history entry's ID
 */
export async function createHistory(messageIds: string[]): Promise<{ historyId: string }> {
  try {
    // Get the current session's access token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ messageIds }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating history:', error);
    throw error;
  }
}

/**
 * Fetch a history entry by ID
 * 
 * This function makes a GET request to retrieve a specific history entry.
 * This can be useful if you need to get the current state before subscribing
 * to updates.
 * 
 * @param historyId - ID of the history entry to fetch
 * @returns Promise resolving to the history entry
 */
export async function getHistory(historyId: string): Promise<any> {
  try {
    // Get the current session's access token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/history/${historyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
} 