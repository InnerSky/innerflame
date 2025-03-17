/**
 * User type definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
} 