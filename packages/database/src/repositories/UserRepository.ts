// UserRepository.ts - Handles database operations for users

import { supabase } from '../utils/client';

// User interface will be defined in shared-types
interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export class UserRepository {
  /**
   * Get a user by ID
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return data as User;
  }
  
  /**
   * Get a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
    
    return data as User;
  }
  
  /**
   * Update user metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update({ metadata })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating user metadata:', error);
      return null;
    }
    
    return data as User;
  }
}
