// Supabase related types
// For use with the Supabase client and authentication

/**
 * Minimalist Supabase user type
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  aud: string;
  created_at: string;
}

/**
 * Supabase session type
 */
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: SupabaseUser;
}

/**
 * Supabase authentication result
 */
export interface AuthResult {
  session: SupabaseSession | null;
  user: SupabaseUser | null;
  error?: {
    message: string;
    status?: number;
  };
}

/**
 * Supabase JWT verification result
 * Used in the WebSocket server to validate tokens
 */
export interface JwtVerificationResult {
  isValid: boolean;
  userId?: string;
  error?: string;
  claims?: {
    sub: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
}

/**
 * Simplified user profile from Supabase
 * For UI display purposes
 */
export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  lastLogin?: Date;
  createdAt: Date;
}
