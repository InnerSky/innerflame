import { supabase } from './supabase';

export type AuthError = {
  message: string;
};

/**
 * Direct function to upsert a user into the users table
 * This ensures user profile is always updated regardless of triggers
 */
export async function updateUserProfile(userId: string, userData: {
  email?: string;
  full_name?: string;
  avatar_url?: string;
}) {
  if (!userId) {
    return { error: 'No user ID provided' };
  }
  
  try {
    // Get existing user from auth API to ensure we have the most current data
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: userError?.message || 'Failed to get current user' };
    }
    
    // Make sure we have a valid email
    if (!user.email && !userData.email) {
      return { error: 'Email is required for profile update' };
    }

    // Check if this is an anonymous user being converted to permanent
    const isAnonymousUser = !!user.app_metadata?.is_anonymous;
    const isBeingConverted = isAnonymousUser && (userData.email || user.email);
    
    if (isBeingConverted) {
      // Check if this is being called from a token refresh event
      // This prevents infinite loops when TOKEN_REFRESHED triggers another update
      const isAlreadyProcessing = sessionStorage.getItem('refreshing_anonymous_user') === userId;
      
      if (isAlreadyProcessing) {
        // Don't remove the flag here, let it be cleared after all processing is done
      } else {
        try {
          // Set flag before making any calls to prevent parallel processing
          sessionStorage.setItem('refreshing_anonymous_user', userId);
          
          // Call the edge function to update the anonymous status
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || window.location.origin}/functions/v1/convert-anonymous-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Include the current session's JWT token for authorization
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
            },
            body: JSON.stringify({ userId })
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            sessionStorage.removeItem('refreshing_anonymous_user');
          } else {
            // Refresh the JWT token to update the client-side session with new metadata
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              sessionStorage.removeItem('refreshing_anonymous_user');
            } else if (refreshData.session) {
              // Keep the flag in sessionStorage for a short time to prevent duplicate calls
              // during the auth callback processing, it will be cleared when auth completes
              setTimeout(() => {
                sessionStorage.removeItem('refreshing_anonymous_user');
              }, 5000);
            }
          }
        } catch (err) {
          sessionStorage.removeItem('refreshing_anonymous_user');
          // Continue anyway - we can still update the profile record
        }
      }
    }
    
    // Get full name from Google account if available
    const googleName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.user_metadata?.preferred_username;
    
    // Prepare user data for update with all available fields
    const userRecord = {
      email: userData.email || user.email || '', // Ensure email is never undefined
      full_name: userData.full_name || googleName || null,
      avatar_url: userData.avatar_url || user.user_metadata?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };
    
    // Check if user exists first
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return { error: checkError.message };
    }
    
    if (existingUser) {
      // User exists, update it
      const { error: updateError } = await supabase
        .from('users')
        .update(userRecord)
        .eq('id', userId);
      
      if (updateError) {
        return { error: updateError.message };
      }
    } else {
      // User doesn't exist, create it (this should only happen for new users, not linked accounts)
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          ...userRecord,
          id: userId,
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        return { error: insertError.message };
      }
    }
    
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function signInWithGoogle(isAnonymous: boolean = false) {
  try {
    if (isAnonymous) {
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
    // Clear local storage items - both generic and project-specific
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-lpxnyybizytwcqdqasll-auth-token');
    
    // Use signOut with global scope to clear all sessions
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      return { error: { message: error.message } };
    }
    
    return { error: null };
  } catch (err) {
    // Attempt cleanup again in case of error during signOut call
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-lpxnyybizytwcqdqasll-auth-token');
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
      throw new Error(`Failed to get current user: ${userError.message}`);
    }
    if (!user) throw new Error('No user found');

    const userId = user.id;

    // 1. Delete all messages from the user
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId);
    if (messagesError) {
      throw new Error(`Failed to delete messages: ${messagesError.message}`);
    }

    // 2. Delete all entity versions for the user's documents
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('id, active_version_id')
      .eq('user_id', userId);
    if (entitiesError) {
      throw new Error(`Failed to fetch entities: ${entitiesError.message}`);
    }

    if (entities && entities.length > 0) {
      const entityIds = entities.map(e => e.id);
      
      // First, update all entities to remove active version references
      const { error: updateError } = await supabase
        .from('entities')
        .update({ active_version_id: null })
        .in('id', entityIds);
      if (updateError) {
        throw new Error(`Failed to update entities: ${updateError.message}`);
      }

      // Then delete versions
      const { error: versionsError } = await supabase
        .from('entity_versions')
        .delete()
        .in('entity_id', entityIds);
      if (versionsError) {
        throw new Error(`Failed to delete entity versions: ${versionsError.message}`);
      }

      // Finally delete entities
      const { error: deleteEntitiesError } = await supabase
        .from('entities')
        .delete()
        .in('id', entityIds);
      if (deleteEntitiesError) {
        throw new Error(`Failed to delete entities: ${deleteEntitiesError.message}`);
      }
    }

    // 3. Delete user's record from users table
    const { error: deleteUserRecordError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (deleteUserRecordError) {
      throw new Error(`Failed to delete user record: ${deleteUserRecordError.message}`);
    }

    // 4. Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error(`Failed to sign out: ${signOutError.message}`);
    }

    // 5. Call the Edge Function to delete the user
    const { data, error: functionError } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });

    if (functionError) {
      throw new Error(`Failed to delete user via edge function: ${functionError.message}`);
    }
    
    return { error: null };
  } catch (err) {
    return { 
      error: { 
        message: err instanceof Error ? err.message : 'An unknown error occurred while deleting account' 
      } 
    };
  }
}

export async function linkGoogleIdentity() {
  try {
    // First verify this is indeed an anonymous user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return { 
        error: { 
          message: userError.message 
        } 
      };
    }
    
    // Make sure we're working with an anonymous user
    if (!currentUser || !currentUser.app_metadata?.is_anonymous) {
      return {
        error: {
          message: 'Can only link identities to anonymous users'
        }
      };
    }

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
      return { 
        error: { 
          message: error.message 
        } 
      };
    }
    
    // IMPORTANT: Since we can't directly handle the post-redirect state here,
    // we'll set a flag in localStorage to indicate that we need to update the profile
    // after the redirect completes
    localStorage.setItem('pendingProfileUpdate', 'true');
    localStorage.setItem('profileUpdateUserId', currentUser.id);

    return { error: null, data };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : 'An unknown error occurred during Google account linking'
      }
    };
  }
}

/**
 * Handles database errors related to missing user profiles.
 * If an operation fails because a user doesn't exist in the users table,
 * this will attempt to fix it or clean up the invalid session.
 */
export async function handleUserConstraintError(error: any): Promise<boolean> {
  // Check if it's a foreign key constraint error involving users table
  const isForeignKeyError = error?.code === '23503' && 
                          error?.details?.includes('is not present in table "users"');
  
  if (isForeignKeyError) {
    // Extract user ID from error details for better debugging
    const userIdMatch = error?.details?.match(/Key \(user_id\)=\(([^)]+)\)/);
    const missingUserId = userIdMatch ? userIdMatch[1] : 'unknown';
    
    try {
      // Get current user from auth system
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        await forceCleanSignOut();
        return true; // Error was handled
      }
      
      // Check if the error's user ID matches the current user
      if (user.id !== missingUserId) {
        await forceCleanSignOut();
        return true;
      }
      
      // Check if user has an email (registered) or is anonymous
      if (user.email) {
        // Try to create the missing user profile
        const { error: updateError } = await updateUserProfile(user.id, {
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url
        });
        
        if (updateError) {
          await forceCleanSignOut();
          return true; // Error was handled by signing out
        }
        
        return true; // Error was handled by fixing the user profile
      } else if (user.app_metadata?.is_anonymous) {
        // For anonymous users, try to create a basic profile to fix the constraint
        const { error: updateError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: `anonymous-${user.id}@example.com`, // Temporary email to satisfy constraints
            full_name: 'Anonymous User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (updateError) {
          await forceCleanSignOut();
          return true;
        }
        
        return true;
      } else {
        // User without email and not anonymous - this could be a misconfiguration
        await forceCleanSignOut();
        return true; // Error was handled by signing out
      }
    } catch (err) {
      await forceCleanSignOut();
      return true; // Error was handled by signing out
    }
  }
  
  // Not a user constraint error, or couldn't be handled
  return false;
}

/**
 * Force a clean sign-out when user data is in an inconsistent state.
 * This completely clears all auth state and local storage to ensure
 * a clean slate for the next sign-in attempt.
 */
export async function forceCleanSignOut(): Promise<void> {
  try {
    // First try to clear session via Supabase
    await supabase.auth.signOut({ scope: 'global' });
    
    // Then clear all potential auth-related items from localStorage
    const authTokenKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase.auth') || 
      key.includes('supabase-auth') || 
      key.includes('sb-') ||
      key.includes('pendingProfile') ||
      key.includes('profileUpdate')
    );
    
    authTokenKeys.forEach(key => localStorage.removeItem(key));
    
    // Force a page reload to reset all application state
    window.location.href = '/';
  } catch (err) {
    // If all else fails, do a hard reload
    window.location.reload();
  }
}