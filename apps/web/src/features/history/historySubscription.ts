import { createClient } from '@supabase/supabase-js';
import type { Database } from '@innerflame/types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Subscribe to updates to a history record
 * 
 * This function sets up a real-time subscription to a specific history record.
 * It returns an unsubscribe function that should be called when the component unmounts.
 * 
 * @param historyId - The ID of the history record to subscribe to
 * @param callback - Function to call when the history record is updated
 * @returns A function to unsubscribe from the updates
 */
export function subscribeToHistory(historyId: string, callback: (data: any) => void) {
  console.log(`Subscribing to history updates for ID: ${historyId}`);
  
  const channel = supabase
    .channel(`history:${historyId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'history',
      filter: `id=eq.${historyId}`
    }, (payload) => {
      console.log('History update received:', payload);
      callback(payload.new);
    })
    .subscribe((status) => {
      console.log(`History subscription status: ${status}`);
    });

  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribing from history updates for ID: ${historyId}`);
    supabase.removeChannel(channel);
  };
} 