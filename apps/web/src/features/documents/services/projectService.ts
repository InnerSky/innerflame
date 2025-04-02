import { DocumentService } from './documentService.js';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { Document } from '../models/document.js';
import { MessageServiceStatic as MessageService } from '@/lib/services.js';
import { MessageContextType } from '@innerflame/types';

// Singleton instance
let instance: ProjectService | null = null;

export class ProjectService {
  private repository: DocumentRepository;
  private documentService: DocumentService;
  
  constructor() {
    this.repository = new DocumentRepository();
    this.documentService = DocumentService.getInstance();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ProjectService {
    if (!instance) {
      instance = new ProjectService();
    }
    return instance;
  }
  
  /**
   * Delete a project and all its associated documents and messages
   * 
   * @param projectId - The ID of the project to delete
   * @param userId - The ID of the user who owns the project
   * @returns Promise resolving when deletion is complete
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    if (!projectId || !userId) {
      throw new Error('Project ID and user ID are required');
    }
    
    try {
      // 1. First, explicitly delete messages associated with the project context
      await MessageService.deleteMessagesByContext(projectId, MessageContextType.Project);
      
      // 2. Then use the DocumentService to delete the project and all its documents
      // (which will also delete messages associated with each document)
      await this.documentService.deleteDocument(projectId, {
        userId,
        cascadeRelated: true
      });
      
      // Note: The deletion flow is now:
      // 1. Delete messages where context_type = project and context_id = projectId
      // 2. DocumentService deletes each document in the project (and their messages)
      // 3. DocumentService deletes the project document itself
      
      // Additional project-specific cleanup can be added here if needed in the future
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error);
      throw new Error(`Failed to delete project: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get all documents belonging to a project
   * 
   * @param projectId - The ID of the project
   * @param userId - The ID of the user who owns the project
   * @returns Promise resolving to an array of documents
   */
  async getProjectDocuments(projectId: string, userId: string): Promise<Document[]> {
    if (!projectId || !userId) {
      throw new Error('Project ID and user ID are required');
    }
    
    try {
      return await this.repository.getDocumentsByProject(userId, projectId);
    } catch (error) {
      console.error(`Error fetching project documents for project ${projectId}:`, error);
      throw new Error(`Failed to fetch project documents: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get project details
   * 
   * @param projectId - The ID of the project
   * @returns Promise resolving to the project document or null if not found
   */
  async getProject(projectId: string): Promise<Document | null> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    try {
      return await this.repository.getDocumentWithVersions(projectId);
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw new Error(`Failed to fetch project: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get all projects for a user
   * 
   * @param userId - The ID of the user
   * @returns Promise resolving to an array of project documents
   */
  async getUserProjects(userId: string): Promise<Document[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      return await this.repository.getUserProjectsOnly(userId);
    } catch (error) {
      console.error(`Error fetching projects for user ${userId}:`, error);
      throw new Error(`Failed to fetch user projects: ${(error as Error).message}`);
    }
  }
} 