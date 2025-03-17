/**
 * Project type definitions
 */

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
} 