import { DocumentRepository } from '../repositories/documentRepository.js';
import { DocumentType } from '../models/document.js';
import { Document } from '../models/document.js';

// Default content for a new lean canvas
export const DEFAULT_LEAN_CANVAS_CONTENT = {
  "Title": "",
  "Subtitle": "",
  "Customer Segments": "",
  "Early Adopters": "",
  "Problem": "",
  "Existing Alternatives": "",
  "Unique Value Proposition": "",
  "High Level Concept": "",
  "Solution": "",
  "Channels": "",
  "Revenue Streams": "",
  "Cost Structure": "",
  "Key Metrics": "",
  "Unfair Advantage": "",
  "Notes": ""
};

export class LeanCanvasService {
  private repository: DocumentRepository;

  constructor() {
    this.repository = new DocumentRepository();
  }

  /**
   * Create a new lean canvas document
   * 
   * @param userId - The ID of the user who will own the document
   * @param title - Optional title for the document (defaults to "New Canvas")
   * @param content - Optional custom content (defaults to DEFAULT_LEAN_CANVAS_CONTENT)
   * @returns The created document
   */
  async createLeanCanvas(
    userId: string,
    title: string = "New Canvas",
    content: Record<string, string> = DEFAULT_LEAN_CANVAS_CONTENT
  ): Promise<Document> {
    try {
      return await this.repository.createDocument(
        userId,
        title,
        JSON.stringify(content),
        DocumentType.LeanCanvas
      );
    } catch (error) {
      console.error("Error creating lean canvas:", error);
      throw new Error(`Failed to create lean canvas: ${(error as Error).message}`);
    }
  }

  /**
   * Get the most recent lean canvas for a user
   * 
   * @param userId - The ID of the user
   * @returns The most recent lean canvas document or null if none exists
   */
  async getMostRecentLeanCanvas(userId: string): Promise<Document | null> {
    try {
      const documents = await this.repository.getUserDocuments(userId);
      
      // Filter for lean canvas documents and get the most recent one
      const leanCanvasDocuments = documents
        .filter(doc => doc.entityType === DocumentType.LeanCanvas)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      return leanCanvasDocuments.length > 0 ? leanCanvasDocuments[0] : null;
    } catch (error) {
      console.error("Error fetching lean canvas:", error);
      throw new Error(`Failed to fetch lean canvas: ${(error as Error).message}`);
    }
  }

  /**
   * Save changes to a lean canvas document
   * 
   * @param documentId - The ID of the document to update
   * @param title - The title of the document
   * @param content - The content as a Record/object (will be stringified to JSON)
   * @returns The updated document
   */
  async saveLeanCanvas(
    documentId: string,
    title: string,
    content: Record<string, string>
  ): Promise<Document> {
    try {
      return await this.repository.saveDocument(
        documentId,
        title,
        JSON.stringify(content)
      );
    } catch (error) {
      console.error("Error saving lean canvas:", error);
      throw new Error(`Failed to save lean canvas: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific lean canvas document by ID
   * 
   * @param documentId - The ID of the document to fetch
   * @returns The document or null if not found
   */
  async getLeanCanvas(documentId: string): Promise<Document | null> {
    try {
      const document = await this.repository.getDocumentWithVersions(documentId);
      
      // Only return if it's a lean canvas document
      if (document && document.entityType === DocumentType.LeanCanvas) {
        return document;
      }
      return null;
    } catch (error) {
      console.error("Error fetching lean canvas by ID:", error);
      throw new Error(`Failed to fetch lean canvas: ${(error as Error).message}`);
    }
  }
}

// Create and export a singleton instance
const leanCanvasService = new LeanCanvasService();
export default leanCanvasService; 