import { Request, Response, NextFunction } from 'express';
import { createSupabaseClient } from '@innerflame/utils/supabase.js';
import { SupabaseService } from '../services/supabase/supabaseService.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      }
    }
  }
}

/**
 * Middleware to authenticate users via Supabase
 * Extracts the JWT token from the Authorization header and verifies it
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use existing Supabase client from the service
    const supabase = SupabaseService.getClient();
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    // Add the user to the request object
    req.user = {
      id: user.id,
      email: user.email
    };
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Authentication error' 
    });
  }
}; 