/**
 * Document type definitions
 */

export interface Document {
  id: string;
  projectId: string;
  documentType: string;
  name: string;
  status: 'draft' | 'completed' | 'archived';
  version: number;
  dataType: 'json' | 'html' | 'markdown';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: unknown;
  createdBy: string;
  timestamp: string;
} 