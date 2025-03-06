import { Json, Tables } from "@/types/supabase";
import { Document, DocumentVersion, DocumentContent, DocumentMetadata, DocumentType } from "./document";

// Extract content from JSON
export function extractContent(fullContent: Json | null): DocumentContent {
  if (!fullContent) return { title: '', content: '' };
  
  // Handle string JSON
  if (typeof fullContent === 'string') {
    try {
      const parsed = JSON.parse(fullContent);
      return {
        title: parsed.title || '',
        content: parsed.content || ''
      };
    } catch (e) {
      console.error('Error parsing full_content:', e);
      return { title: '', content: '' };
    }
  }
  
  // Handle object
  if (typeof fullContent === 'object') {
    const content = fullContent as Record<string, any>;
    return {
      title: content.title || '',
      content: content.content || ''
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
    ...entity,                              // Spread base properties
    entityType: entity.entity_type as DocumentType, // Cast to enum
    createdAt: new Date(entity.created_at || new Date().toISOString()),
    updatedAt: new Date(entity.updated_at || new Date().toISOString()),
    content: currentVersion 
      ? extractContent(currentVersion.full_content).content 
      : (entity.content || ''),
    metadata: entity.metadata as DocumentMetadata || {},
    
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
    ...version,
    entityType: version.entity_type as DocumentType, // Cast to enum
    content: contentData,
    createdAt: new Date(version.created_at || new Date().toISOString()),
    isCurrent: version.is_current || false,
    changes: version.changes as Record<string, unknown> || {},
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
    user_id: document.user_id,
    metadata: document.metadata as Json || null,
  };
}

// Map document content to version full_content
export function createFullContent(title: string, content: string): Json {
  return {
    title,
    content
  };
} 