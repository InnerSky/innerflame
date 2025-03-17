import { supabase } from './supabase';

export type AuthError = {
  message: string;
};

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { 
      user: null, 
      error: { 
        message: err instanceof Error ? err.message : 'An unknown error occurred during sign up' 
      } 
    };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { 
      user: null, 
      error: { 
        message: err instanceof Error ? err.message : 'An unknown error occurred during sign in' 
      } 
    };
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : 'An unknown error occurred during Google sign in'
      }
    };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { error: { message: error.message } };
    }
    
    return { error: null };
  } catch (err) {
    return { 
      error: { 
        message: err instanceof Error ? err.message : 'An unknown error occurred during sign out' 
      } 
    };
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { user: null, error: { message: error.message } };
    }
    
    if (!data.session) {
      return { user: null, error: null };
    }
    
    return { user: data.session.user, error: null };
  } catch (err) {
    return { 
      user: null, 
      error: { 
        message: err instanceof Error ? err.message : 'An unknown error occurred getting current user' 
      } 
    };
  }
}