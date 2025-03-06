import { supabase } from "@/lib/supabase";
import { Document, DocumentVersion } from "../models/document";
import { 
  mapEntityToDocument, 
  mapEntityVersionToDocumentVersion,
  createFullContent
} from "../models/mappers";

export class DocumentRepository {
  // Fetch all documents for a user
  async getUserDocuments(userId: string): Promise<Document[]> {
    // Fetch all entities
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', 'user_document')
      .order('updated_at', { ascending: false });
      
    if (entitiesError) throw entitiesError;
    if (!entities || entities.length === 0) return [];
    
    // Fetch all current versions
    const entityIds = entities.map(entity => entity.id);
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('*')
      .in('entity_id', entityIds)
      .eq('is_current', true);
      
    if (versionsError) throw versionsError;
    
    // Map entities to documents
    const versionMap = new Map();
    if (versions) {
      versions.forEach(version => {
        versionMap.set(version.entity_id, version);
      });
    }
    
    return entities.map(entity => 
      mapEntityToDocument(entity, versionMap.get(entity.id))
    );
  }
  
  // Fetch document by ID with all versions
  async getDocumentWithVersions(documentId: string): Promise<Document | null> {
    // Fetch the entity
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (entityError) throw entityError;
    if (!entity) return null;
    
    // Fetch all versions
    const { data: versionEntities, error: versionsError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .order('version_number', { ascending: false });
      
    if (versionsError) throw versionsError;
    
    // Find current version
    const currentVersion = versionEntities?.find(v => v.is_current) || null;
    
    // Map to domain model
    const document = mapEntityToDocument(entity, currentVersion || undefined);
    
    // Add all versions
    if (versionEntities) {
      document.versions = versionEntities.map(mapEntityVersionToDocumentVersion);
    }
    
    return document;
  }
  
  // Create new document
  async createDocument(userId: string, title: string, content: string): Promise<Document> {
    // Create entity
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .insert({
        user_id: userId,
        title: title,
        content: null, // Content will be in version
        entity_type: 'user_document',
      })
      .select()
      .single();
      
    if (entityError) throw entityError;
    
    // Create initial version
    const { data: version, error: versionError } = await supabase
      .from('entity_versions')
      .insert({
        entity_id: entity.id,
        entity_type: 'user_document',
        version_number: 1,
        full_content: createFullContent(title, content),
        version_type: 'initial',
        is_current: true,
      })
      .select()
      .single();
      
    if (versionError) throw versionError;
    
    // Return document domain model
    return mapEntityToDocument(entity, version);
  }
  
  // Save document changes
  async saveDocument(documentId: string, title: string, content: string): Promise<Document> {
    const now = new Date().toISOString();
    
    // Update entity
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .update({
        title,
        updated_at: now
      })
      .eq('id', documentId)
      .select()
      .single();
      
    if (entityError) throw entityError;
    
    // Get current version
    const { data: currentVersions, error: currentVersionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .eq('is_current', true);
      
    if (currentVersionError) throw currentVersionError;
    
    const currentVersion = currentVersions?.[0];
    const newVersionNumber = currentVersion ? currentVersion.version_number + 1 : 1;
    
    // Mark previous version as not current
    if (currentVersion) {
      await supabase
        .from('entity_versions')
        .update({ is_current: false })
        .eq('id', currentVersion.id);
    }
    
    // Create new version
    const { data: newVersion, error: newVersionError } = await supabase
      .from('entity_versions')
      .insert({
        entity_id: documentId,
        entity_type: 'user_document',
        version_number: newVersionNumber,
        full_content: createFullContent(title, content),
        version_type: 'update',
        is_current: true,
        base_version_id: currentVersion?.id,
        created_at: now
      })
      .select()
      .single();
      
    if (newVersionError) throw newVersionError;
    
    // Return updated document
    return mapEntityToDocument(entity, newVersion);
  }
  
  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    // Delete all versions first
    await supabase
      .from('entity_versions')
      .delete()
      .eq('entity_id', documentId);
    
    // Delete the entity
    await supabase
      .from('entities')
      .delete()
      .eq('id', documentId);
  }
  
  // Get document versions
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data: versions, error } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .order('version_number', { ascending: false });
      
    if (error) throw error;
    if (!versions || versions.length === 0) return [];
    
    return versions.map(mapEntityVersionToDocumentVersion);
  }
  
  // Activate a specific version (create new version based on old one)
  async activateVersion(version: DocumentVersion): Promise<Document> {
    const { entityId, content } = version;
    const now = new Date().toISOString();
    
    // Get the entity
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single();
      
    if (entityError) throw entityError;
    
    // Get highest version number
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('version_number')
      .eq('entity_id', entityId)
      .order('version_number', { ascending: false })
      .limit(1);
      
    if (versionsError) throw versionsError;
    
    const newVersionNumber = (versions && versions.length > 0) 
      ? versions[0].version_number + 1 
      : 1;
    
    // Mark all versions as not current
    await supabase
      .from('entity_versions')
      .update({ is_current: false })
      .eq('entity_id', entityId);
    
    // Create new version based on the activated version
    const { data: newVersion, error: newVersionError } = await supabase
      .from('entity_versions')
      .insert({
        entity_id: entityId,
        entity_type: entity.entity_type,
        version_number: newVersionNumber,
        full_content: createFullContent(content.title, content.content),
        version_type: 'restore',
        is_current: true,
        base_version_id: version.id,
        created_at: now
      })
      .select()
      .single();
      
    if (newVersionError) throw newVersionError;
    
    // Update entity title
    await supabase
      .from('entities')
      .update({
        title: content.title,
        updated_at: now
      })
      .eq('id', entityId);
    
    // Return updated document
    return mapEntityToDocument(
      { ...entity, title: content.title, updated_at: now },
      newVersion
    );
  }
  
  // Duplicate a document
  async duplicateDocument(documentId: string): Promise<Document> {
    // Get original document with current version
    const originalDoc = await this.getDocumentWithVersions(documentId);
    if (!originalDoc) throw new Error("Document not found");
    
    // Create a new document with the same content but a new title
    return this.createDocument(
      originalDoc.userId,
      `${originalDoc.title} (Copy)`,
      originalDoc.content
    );
  }
} 