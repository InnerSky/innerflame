import { supabase } from "@/lib/supabase";
import { Document, DocumentVersion, DocumentType, DocumentMetadata } from "../models/document";
import { 
  mapEntityToDocument, 
  mapEntityVersionToDocumentVersion,
  createFullContent
} from "../models/mappers";

// Define document types that should be treated as documents in listings
export const DOCUMENT_TYPES = [
  DocumentType.UserDocument,
  DocumentType.LeanCanvas,
  DocumentType.FuturePressRelease,
  DocumentType.SalesPage
];

export class DocumentRepository {
  // Fetch all documents for a user
  async getUserDocuments(userId: string): Promise<Document[]> {
    // Fetch all entities
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', userId)
      .in('entity_type', DOCUMENT_TYPES)
      .order('updated_at', { ascending: false });
      
    if (entitiesError) throw entitiesError;
    if (!entities) return [];
    
    // Fetch current versions
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('*')
      .in('entity_id', entities.map(e => e.id))
      .eq('is_current', true);
      
    if (versionsError) throw versionsError;
    
    // Map to domain models
    return entities.map(entity => {
      const currentVersion = versions?.find(v => v.entity_id === entity.id);
      return mapEntityToDocument(entity, currentVersion);
    });
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
  async createDocument(
    userId: string, 
    title: string, 
    content: string, 
    documentType: DocumentType = DocumentType.UserDocument,
    metadata?: DocumentMetadata
  ): Promise<Document> {
    // Create entity
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .insert({
        user_id: userId,
        title: title,
        content: null, // Content will be in version
        entity_type: documentType,
        metadata: metadata || {} // Add metadata to the entity
      })
      .select()
      .single();
      
    if (entityError) throw entityError;
    
    // Create initial version
    const { data: version, error: versionError } = await supabase
      .from('entity_versions')
      .insert({
        entity_id: entity.id,
        entity_type: documentType,
        version_number: 1,
        full_content: createFullContent(title, content),
        version_type: 'initial',
        is_current: true,
      })
      .select()
      .single();
      
    if (versionError) throw versionError;

    // Update entity with active_version_id
    const { error: updateError } = await supabase
      .from('entities')
      .update({ active_version_id: version.id })
      .eq('id', entity.id);

    if (updateError) throw updateError;
    
    // Return document domain model
    return mapEntityToDocument({ ...entity, active_version_id: version.id }, version);
  }
  
  private async cleanupOldVersions(documentId: string, maxVersions: number = 20): Promise<void> {
    // Get all versions ordered by version number
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .order('version_number', { ascending: true });
      
    if (versionsError) throw versionsError;
    if (!versions || versions.length <= maxVersions) return;

    // Find versions to delete (oldest ones that are not current)
    const versionsToDelete = versions
      .filter(v => !v.is_current) // Never delete current version
      .slice(0, versions.length - maxVersions); // Keep only the most recent versions

    if (versionsToDelete.length === 0) return;

    // Get IDs of versions to delete
    const idsToDelete = versionsToDelete.map(v => v.id);

    // Update base_version_id references for remaining versions
    // Find the oldest version we're keeping
    const oldestKeptVersion = versions.find(v => !idsToDelete.includes(v.id));
    if (oldestKeptVersion) {
      // Update any versions that referenced the deleted versions
      await supabase
        .from('entity_versions')
        .update({ base_version_id: oldestKeptVersion.id })
        .in('base_version_id', idsToDelete)
        .eq('entity_id', documentId);
    }

    // Delete the old versions
    const { error: deleteError } = await supabase
      .from('entity_versions')
      .delete()
      .in('id', idsToDelete)
      .eq('entity_id', documentId); // Extra safety check

    if (deleteError) {
      console.error('Error cleaning up old versions:', deleteError);
      throw deleteError;
    }

    // Log the cleanup for auditing
    console.log(`Cleaned up ${versionsToDelete.length} old versions for document ${documentId}`);
  }

  // Save document changes
  async saveDocument(documentId: string, title: string, content: string): Promise<Document> {
    const now = new Date().toISOString();
    
    // Get the existing entity to preserve metadata
    const { data: existingEntity, error: getError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (getError) throw getError;
    
    // Get current version
    const { data: currentVersions, error: currentVersionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .eq('is_current', true);
      
    if (currentVersionError) throw currentVersionError;
    
    const currentVersion = currentVersions?.[0];
    const newVersionNumber = currentVersion ? currentVersion.version_number + 1 : 1;
    
    // Start a transaction for version management
    try {
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
          entity_type: existingEntity.entity_type, // Use correct entity type
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
      
      // Update entity with new title and active version
      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .update({
          title,
          updated_at: now,
          metadata: existingEntity.metadata,
          active_version_id: newVersion.id
        })
        .eq('id', documentId)
        .select()
        .single();
        
      if (entityError) throw entityError;

      // Clean up old versions after successful save
      await this.cleanupOldVersions(documentId);
      
      // Return updated document
      return mapEntityToDocument(entity, newVersion);
    } catch (error) {
      console.error('Error during version management:', error);
      throw new Error(`Failed to save document: ${(error as Error).message}`);
    }
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
  
  // Activate a specific version
  async activateVersion(version: DocumentVersion): Promise<Document> {
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', version.entity_id)
      .single();
      
    if (entityError) throw entityError;
    if (!entity) throw new Error('Entity not found');
    
    // Get highest version number
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('version_number')
      .eq('entity_id', version.entity_id)
      .order('version_number', { ascending: false })
      .limit(1);
      
    if (versionsError) throw versionsError;
    
    const newVersionNumber = versions && versions.length > 0 
      ? versions[0].version_number + 1 
      : 1;
    
    const now = new Date().toISOString();
    
    // Set all versions to not current
    await supabase
      .from('entity_versions')
      .update({ is_current: false })
      .eq('entity_id', version.entity_id);
    
    // Create new version based on the activated version
    const { data: newVersion, error: newVersionError } = await supabase
      .from('entity_versions')
      .insert({
        entity_id: version.entity_id,
        entity_type: entity.entity_type,
        version_number: newVersionNumber,
        full_content: createFullContent(version.content.title, version.content.content),
        version_type: 'restore',
        is_current: true,
        base_version_id: version.id,
        created_at: now
      })
      .select()
      .single();
      
    if (newVersionError) throw newVersionError;
    
    // Update entity title and active version
    const { data: updatedEntity, error: updateError } = await supabase
      .from('entities')
      .update({
        title: version.content.title,
        updated_at: now,
        active_version_id: newVersion.id
      })
      .eq('id', version.entity_id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Return updated document
    return mapEntityToDocument(updatedEntity, newVersion);
  }
  
  // Duplicate a document
  async duplicateDocument(documentId: string): Promise<Document> {
    const original = await this.getDocumentWithVersions(documentId);
    if (!original) throw new Error('Document not found');
    
    // Create a new document with same content but "(Copy)" in the title
    return this.createDocument(
      original.user_id,
      `${original.title} (Copy)`,
      original.content,
      original.entityType,
      original.metadata // Copy the original metadata
    );
  }
  
  // Update a document's type
  async updateDocumentType(documentId: string, newType: DocumentType): Promise<Document> {
    const now = new Date().toISOString();
    
    // Get the existing entity to preserve metadata
    const { data: existingEntity, error: getError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (getError) throw getError;
    
    // Update the entity type while preserving metadata
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .update({
        entity_type: newType,
        updated_at: now,
        metadata: existingEntity.metadata // Preserve existing metadata
      })
      .eq('id', documentId)
      .select()
      .single();
      
    if (entityError) throw entityError;
    if (!entity) throw new Error('Entity not found');
    
    // Update the current version's entity type
    const { data: currentVersion, error: versionError } = await supabase
      .from('entity_versions')
      .update({
        entity_type: newType
      })
      .eq('entity_id', documentId)
      .eq('is_current', true)
      .select()
      .single();
      
    if (versionError) throw versionError;
    
    // Return updated document
    return mapEntityToDocument(entity, currentVersion);
  }
  
  // Add a method to update document metadata
  async updateDocumentMetadata(documentId: string, metadata: any): Promise<Document> {
    // Get the current document
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (entityError) throw entityError;
    
    // Update the metadata
    const { data: updatedEntity, error: updateError } = await supabase
      .from('entities')
      .update({
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    // Get current version to return a complete document
    const { data: currentVersion, error: versionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .eq('is_current', true)
      .single();
      
    if (versionError) throw versionError;
    
    // Return updated document
    return mapEntityToDocument(updatedEntity, currentVersion);
  }
  
  // Fetch all projects for a user
  async getUserProjectsOnly(userId: string): Promise<Document[]> {
    // Fetch all entities of type Project
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', DocumentType.Project)
      .order('updated_at', { ascending: false });
      
    if (entitiesError) throw entitiesError;
    if (!entities) return [];
    
    // Fetch current versions
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('*')
      .in('entity_id', entities.map(e => e.id))
      .eq('is_current', true);
      
    if (versionsError) throw versionsError;
    
    // Map to domain models
    return entities.map(entity => {
      const currentVersion = versions?.find(v => v.entity_id === entity.id);
      return mapEntityToDocument(entity, currentVersion);
    });
  }
  
  // Fetch documents for a specific project
  async getDocumentsByProject(userId: string, projectId: string): Promise<Document[]> {
    // Fetch all entities with metadata.projectId equal to the provided projectId
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', userId)
      .in('entity_type', DOCUMENT_TYPES)
      .contains('metadata', { projectId });
      
    if (entitiesError) throw entitiesError;
    if (!entities) return [];
    
    // Fetch current versions
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('*')
      .in('entity_id', entities.map(e => e.id))
      .eq('is_current', true);
      
    if (versionsError) throw versionsError;
    
    // Map to domain models
    return entities.map(entity => {
      const currentVersion = versions?.find(v => v.entity_id === entity.id);
      return mapEntityToDocument(entity, currentVersion);
    });
  }
  
  // Set the project for a document
  async setDocumentProject(documentId: string, projectId: string | null): Promise<Document> {
    // Get the existing entity to preserve metadata
    const { data: existingEntity, error: getError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (getError) throw getError;
    
    // Update metadata with projectId
    const metadata = existingEntity.metadata as Record<string, any> || {};
    
    if (projectId) {
      metadata.projectId = projectId;
    } else {
      // Remove projectId if null is passed
      if (metadata.projectId) {
        delete metadata.projectId;
      }
    }
    
    // Update entity with new metadata
    const { data: entity, error: updateError } = await supabase
      .from('entities')
      .update({
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    // Get current version to return a complete document
    const { data: currentVersion, error: versionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .eq('is_current', true)
      .single();
      
    if (versionError) throw versionError;
    
    // Return updated document
    return mapEntityToDocument(entity, currentVersion);
  }
  
  // Create a new project
  async createProject(userId: string, title: string, content: string = ''): Promise<Document> {
    return this.createDocument(
      userId,
      title,
      content,
      DocumentType.Project
    );
  }
  
  // Get documents without any project assigned
  async getDocumentsWithNoProject(userId: string): Promise<Document[]> {
    // First fetch all user documents
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', DocumentType.UserDocument);
      
    if (entitiesError) throw entitiesError;
    if (!entities) return [];
    
    // Filter locally to find documents without projectId in metadata
    const documentsWithNoProject = entities.filter(entity => {
      const metadata = entity.metadata as Record<string, any> || {};
      return !metadata || !metadata.projectId;
    });
    
    if (documentsWithNoProject.length === 0) return [];
    
    // Fetch current versions for the filtered documents
    const { data: versions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('*')
      .in('entity_id', documentsWithNoProject.map(e => e.id))
      .eq('is_current', true);
      
    if (versionsError) throw versionsError;
    
    // Map to domain models
    return documentsWithNoProject.map(entity => {
      const currentVersion = versions?.find(v => v.entity_id === entity.id);
      return mapEntityToDocument(entity, currentVersion);
    });
  }

  // Get a specific document version by version ID
  async getVersionById(versionId: string): Promise<DocumentVersion | null> {
    const { data: version, error } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('id', versionId)
      .single();
      
    if (error) throw error;
    if (!version) return null;
    
    return mapEntityVersionToDocumentVersion(version);
  }

  // Restore a document to a specific version
  async restoreVersion(versionId: string): Promise<Document> {
    // 1. Get the version to restore
    const version = await this.getVersionById(versionId);
    if (!version) throw new Error("Version not found");
    
    const now = new Date().toISOString();
    
    // 2. Find all versions with higher version numbers
    const { data: newerVersions, error: versionsError } = await supabase
      .from('entity_versions')
      .select('id, version_number')
      .eq('entity_id', version.entity_id)
      .gt('version_number', version.version_number)
      .order('version_number', { ascending: true });
      
    if (versionsError) throw versionsError;
    
    try {
      // First, update the entity record to point to the version we're restoring
      // This must happen BEFORE trying to delete any versions to avoid foreign key constraint violations
      const { error: updateEntityError } = await supabase
        .from('entities')
        .update({
          title: version.content.title,
          updated_at: now,
          active_version_id: versionId
        })
        .eq('id', version.entity_id);
        
      if (updateEntityError) throw updateEntityError;
      
      if (newerVersions && newerVersions.length > 0) {
        // 3. Get messages referencing these versions
        const newerVersionIds = newerVersions.map(v => v.id);
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .in('context_entity_version_id', newerVersionIds);
          
        if (messagesError) throw messagesError;
        
        // 4. Delete these messages in a batch operation
        if (messages && messages.length > 0) {
          const { error: deleteMessagesError } = await supabase
            .from('messages')
            .delete()
            .in('id', messages.map(m => m.id));
            
          if (deleteMessagesError) throw deleteMessagesError;
        }
        
        // 5. Now it's safe to delete newer versions, since they're no longer referenced
        const { error: deleteVersionsError } = await supabase
          .from('entity_versions')
          .delete()
          .in('id', newerVersionIds);
          
        if (deleteVersionsError) throw deleteVersionsError;
      }
      
      // 6. Set all versions to not current
      const { error: updateVersionsError } = await supabase
        .from('entity_versions')
        .update({ is_current: false })
        .eq('entity_id', version.entity_id);
        
      if (updateVersionsError) throw updateVersionsError;
      
      // 7. Set the specified version as current
      const { error: setCurrentError } = await supabase
        .from('entity_versions')
        .update({ is_current: true })
        .eq('id', versionId);
        
      if (setCurrentError) throw setCurrentError;
      
      // 8. Return updated document
      const document = await this.getDocumentWithVersions(version.entity_id);
      if (!document) throw new Error("Failed to retrieve restored document");
      return document;
    } catch (error) {
      throw error;
    }
  }

  // Smart auto-save document with session-based versioning
  async smartAutoSaveDocument(documentId: string, title: string, content: string, sessionTimeoutMinutes: number = 30): Promise<Document> {
    const now = new Date();
    const nowISOString = now.toISOString();
    
    // Get the existing entity to preserve metadata
    const { data: existingEntity, error: getError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (getError) throw getError;
    
    // Get current version
    const { data: currentVersions, error: currentVersionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .eq('is_current', true);
      
    if (currentVersionError) throw currentVersionError;
    
    const currentVersion = currentVersions?.[0];
    
    // Determine if we should create a new version or update the existing one
    const shouldCreateNewVersion = (): boolean => {
      // If no current version, we must create a new one
      if (!currentVersion) return true;
      
      // Always create a new version if current is AI-generated
      if (currentVersion.version_type === 'ai_edit') return true;
      
      // Check if the last update was more than sessionTimeoutMinutes ago
      // First try to use created_at since it's guaranteed to exist
      const lastEditTime = currentVersion.created_at ? new Date(currentVersion.created_at) : now;
      
      const timeDiffMinutes = (now.getTime() - lastEditTime.getTime()) / (1000 * 60);
      return timeDiffMinutes > sessionTimeoutMinutes;
    };
    
    if (shouldCreateNewVersion()) {
      // Create a new version - similar to existing saveDocument logic
      const newVersionNumber = currentVersion ? currentVersion.version_number + 1 : 1;
      
      try {
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
            entity_type: existingEntity.entity_type,
            version_number: newVersionNumber,
            full_content: createFullContent(title, content),
            version_type: 'update',
            is_current: true,
            base_version_id: currentVersion?.id,
            created_at: nowISOString
          })
          .select()
          .single();
          
        if (newVersionError) throw newVersionError;
        
        // Update entity with new title and active version
        const { data: entity, error: entityError } = await supabase
          .from('entities')
          .update({
            title,
            updated_at: nowISOString,
            metadata: existingEntity.metadata,
            active_version_id: newVersion.id
          })
          .eq('id', documentId)
          .select()
          .single();
          
        if (entityError) throw entityError;

        // Clean up old versions after successful save
        await this.cleanupOldVersions(documentId);
        
        // Return updated document
        return mapEntityToDocument(entity, newVersion);
      } catch (error) {
        console.error('Error during version creation:', error);
        throw new Error(`Failed to save document: ${(error as Error).message}`);
      }
    } else {
      // Update existing version instead of creating a new one
      try {
        // Update the content of the current version - note that versions don't have updated_at
        // so we need to track "last edit" differently, perhaps with a field in metadata
        const { data: updatedVersion, error: updateVersionError } = await supabase
          .from('entity_versions')
          .update({
            full_content: createFullContent(title, content)
          })
          .eq('id', currentVersion.id)
          .select()
          .single();
          
        if (updateVersionError) throw updateVersionError;
        
        // Update entity title and timestamp (entity has updated_at)
        const { data: entity, error: entityError } = await supabase
          .from('entities')
          .update({
            title,
            updated_at: nowISOString
          })
          .eq('id', documentId)
          .select()
          .single();
          
        if (entityError) throw entityError;
        
        // Return updated document
        return mapEntityToDocument(entity, updatedVersion);
      } catch (error) {
        console.error('Error updating existing version:', error);
        throw new Error(`Failed to update document: ${(error as Error).message}`);
      }
    }
  }
}

// Export singleton instance for use throughout the app
export const documentRepository = new DocumentRepository(); 