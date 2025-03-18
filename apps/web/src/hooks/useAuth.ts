import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';

export interface User {
  id: string;
  email?: string;
  avatar_url?: string;
  full_name?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session?.user) {
          // Get user profile from users table for additional details
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('avatar_url, full_name, email')
            .eq('id', data.session.user.id)
            .single();
            
          if (userError) {
            console.warn('Error fetching user profile:', userError);
          }
          
          setUser({
            id: data.session.user.id,
            email: userData?.email || data.session.user.email,
            avatar_url: userData?.avatar_url || undefined,
            full_name: userData?.full_name || undefined
          });
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Auth error:', e);
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();
    
    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  return { user, loading, error };
}; 