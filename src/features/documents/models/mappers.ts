import { Tables } from "@/types/supabase";
import { Document, DocumentVersion, DocumentContent } from "./document";

// Extract content from JSON
export function extractContent(fullContent: any): DocumentContent {
  if (!fullContent) return { title: '', content: '' };
  
  // Handle string JSON
  if (typeof fullContent === 'string') {
    try {
      return JSON.parse(fullContent);
    } catch (e) {
      console.error('Error parsing full_content:', e);
      return { title: '', content: '' };
    }
  }
  
  // Handle object
  if (typeof fullContent === 'object') {
    return {
      title: fullContent.title || '',
      content: fullContent.content || ''
    };
  }
  
  return { title: '', content: '' };
}

// Map entity to document
export function mapEntityToDocument(
  entity: Tables<"entities">,
  currentVersion?: Tables<"entity_versions">
): Document {
  return {
    id: entity.id,
    title: entity.title,
    content: currentVersion 
      ? extractContent(currentVersion.full_content).content 
      : (entity.content || ''),
    entityType: entity.entity_type,
    createdAt: new Date(entity.created_at || new Date().toISOString()),
    updatedAt: new Date(entity.updated_at || new Date().toISOString()),
    userId: entity.user_id,
    metadata: entity.metadata as Record<string, any> || {},
    
    // Version-related fields
    currentVersionId: currentVersion?.id,
    versionNumber: currentVersion?.version_number,
  };
}

// Map entity version to document version
export function mapEntityVersionToDocumentVersion(
  version: Tables<"entity_versions">
): DocumentVersion {
  const contentData = extractContent(version.full_content);
  
  return {
    id: version.id,
    entityId: version.entity_id,
    versionNumber: version.version_number,
    content: {
      title: contentData.title,
      content: contentData.content
    },
    createdAt: new Date(version.created_at || new Date().toISOString()),
    isCurrent: version.is_current || false,
    versionType: version.version_type,
    baseVersionId: version.base_version_id || undefined,
    significance: version.significance || undefined,
    userLabel: version.user_label || undefined,
    changes: version.changes as Record<string, any> || {},
  };
}

// Map document back to entity (for updates)
export function mapDocumentToEntity(document: Document): Partial<Tables<"entities">> {
  return {
    id: document.id,
    title: document.title,
    content: document.content || null,
    entity_type: document.entityType,
    updated_at: document.updatedAt.toISOString(),
    user_id: document.userId,
    metadata: document.metadata as any || null,
  };
}

// Map document content to version full_content
export function createFullContent(title: string, content: string): any {
  return {
    title,
    content
  };
} 