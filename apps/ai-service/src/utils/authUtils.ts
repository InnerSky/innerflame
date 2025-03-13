// Authentication utilities for WebSocket connections
import { createClient } from '@supabase/supabase-js';
import http from 'http';
import { parse } from 'url';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Debug environment variables
console.log('Environment variables from process.env:', {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  NODE_ENV: process.env.NODE_ENV
});

// Try loading environment variables from web app's .env if our own isn't working
// This is a development-only fallback
let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// If values aren't found in environment, try to load them from web app's .env
if (!supabaseUrl || !supabaseKey) {
  try {
    // Path to web app's .env file
    const webEnvPath = path.resolve(__dirname, '../../../web/.env');
    
    if (fs.existsSync(webEnvPath)) {
      console.log('Loading from web .env file:', webEnvPath);
      const envConfig = dotenv.parse(fs.readFileSync(webEnvPath));
      
      // Use values from web .env file
      supabaseUrl = envConfig.VITE_SUPABASE_URL || '';
      supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || '';
      
      console.log('Loaded Supabase URL from web .env:', !!supabaseUrl);
      console.log('Loaded Supabase Key from web .env:', !!supabaseKey);
    }
  } catch (error) {
    console.error('Error loading from web .env:', error);
  }
}

// Initialize Supabase client
console.log('Final Supabase URL:', supabaseUrl);
console.log('Final Supabase Key exists:', !!supabaseKey);
const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify a JWT token from Supabase
 * @param token The JWT token to verify
 * @returns Authentication result with userId if successful
 */
export async function verifyToken(token: string): Promise<AuthResult> {
  if (!token) {
    return { isAuthenticated: false, error: 'No token provided' };
  }

  try {
    // Use Supabase to verify the JWT
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return { 
        isAuthenticated: false, 
        error: error ? error.message : 'Invalid token' 
      };
    }

    return {
      isAuthenticated: true,
      userId: data.user.id
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { 
      isAuthenticated: false, 
      error: 'Token verification failed' 
    };
  }
}

/**
 * Extract auth token from a WebSocket upgrade request
 * @param request The HTTP request from WebSocket upgrade
 * @returns The extracted token or null if not found
 */
export function extractTokenFromRequest(request: http.IncomingMessage): string | null {
  // Try to get token from query parameters
  const { query } = parse(request.url || '', true);
  if (query.token) {
    return query.token as string;
  }

  // Try to get token from Authorization header
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from cookies
  const cookies = request.headers.cookie;
  if (cookies) {
    const tokenCookie = cookies
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('sb-auth-token='));
    
    if (tokenCookie) {
      return tokenCookie.substring('sb-auth-token='.length);
    }
  }

  return null;
}
