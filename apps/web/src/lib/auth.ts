import { supabase } from './supabase';

export type AuthError = {
  message: string;
};

export async function signInWithGoogle(isAnonymous: boolean = false) {
  try {
    // If this is an anonymous user converting to a permanent account,
    // we'll use the Supabase linkIdentity API in the future implementation
    if (isAnonymous) {
      // Placeholder - will use supabase.auth.linkIdentity() for anonymous users
      console.log('Anonymous user linking will be implemented with native Supabase API');
      return linkGoogleIdentity(); // For now, maintain compatibility with existing UI
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
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

export async function deleteAccount() {
  try {
    // Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting current user:', userError);
      throw new Error(`Failed to get current user: ${userError.message}`);
    }
    if (!user) throw new Error('No user found');

    const userId = user.id;
    console.log('Starting account deletion for user:', userId);

    // 1. Delete all messages from the user
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId);
    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw new Error(`Failed to delete messages: ${messagesError.message}`);
    }

    // 2. Delete all entity versions for the user's documents
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('id, active_version_id')
      .eq('user_id', userId);
    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
      throw new Error(`Failed to fetch entities: ${entitiesError.message}`);
    }

    if (entities && entities.length > 0) {
      const entityIds = entities.map(e => e.id);
      console.log('Found entities to delete:', entityIds);
      
      // First, update all entities to remove active version references
      const { error: updateError } = await supabase
        .from('entities')
        .update({ active_version_id: null })
        .in('id', entityIds);
      if (updateError) {
        console.error('Error updating entities:', updateError);
        throw new Error(`Failed to update entities: ${updateError.message}`);
      }

      // Then delete versions
      const { error: versionsError } = await supabase
        .from('entity_versions')
        .delete()
        .in('entity_id', entityIds);
      if (versionsError) {
        console.error('Error deleting entity versions:', versionsError);
        throw new Error(`Failed to delete entity versions: ${versionsError.message}`);
      }

      // Finally delete entities
      const { error: deleteEntitiesError } = await supabase
        .from('entities')
        .delete()
        .in('id', entityIds);
      if (deleteEntitiesError) {
        console.error('Error deleting entities:', deleteEntitiesError);
        throw new Error(`Failed to delete entities: ${deleteEntitiesError.message}`);
      }
    }

    // 3. Delete user's record from users table
    const { error: deleteUserRecordError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (deleteUserRecordError) {
      console.error('Error deleting user record:', deleteUserRecordError);
      throw new Error(`Failed to delete user record: ${deleteUserRecordError.message}`);
    }

    // 4. Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Error signing out:', signOutError);
      throw new Error(`Failed to sign out: ${signOutError.message}`);
    }

    // 5. Call the Edge Function to delete the user
    console.log('Calling delete-user edge function');
    const { data, error: functionError } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });

    if (functionError) {
      console.error('Error from delete-user function:', functionError);
      throw new Error(`Failed to delete user via edge function: ${functionError.message}`);
    }
    
    console.log('Account deletion completed successfully');
    return { error: null };
  } catch (err) {
    console.error('Account deletion failed:', err);
    return { 
      error: { 
        message: err instanceof Error ? err.message : 'An unknown error occurred while deleting account' 
      } 
    };
  }
}

export async function linkGoogleIdentity() {
  try {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.error('Error linking Google identity:', error);
      return { 
        error: { 
          message: error.message 
        } 
      };
    }

    return { error: null, data };
  } catch (err) {
    console.error('Exception while linking Google identity:', err);
    return {
      error: {
        message: err instanceof Error ? err.message : 'An unknown error occurred during Google account linking'
      }
    };
  }
}