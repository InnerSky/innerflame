// EntityRepository.ts - Handles database operations for entities

import { supabase } from '../utils/client';
import { Entity, EntityVersion } from '@innerflame/shared-types';

export class EntityRepository {
  /**
   * Find an entity by its ID
   */
  async findById(id: string): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching entity:', error);
      return null;
    }
    
    return data as Entity;
  }
  
  /**
   * Find all entities belonging to a user
   */
  async findByUserId(userId: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching entities:', error);
      return [];
    }
    
    return data as Entity[];
  }
  
  /**
   * Create a new entity
   */
  async create(entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'>): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .insert(entity)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating entity:', error);
      return null;
    }
    
    return data as Entity;
  }
  
  /**
   * Update an entity
   */
  async update(id: string, updates: Partial<Entity>): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating entity:', error);
      return null;
    }
    
    return data as Entity;
  }
  
  /**
   * Delete an entity
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting entity:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get entity versions
   */
  async getVersions(entityId: string): Promise<EntityVersion[]> {
    const { data, error } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', entityId)
      .order('version_number', { ascending: false });
      
    if (error) {
      console.error('Error fetching entity versions:', error);
      return [];
    }
    
    return data as EntityVersion[];
  }
}
