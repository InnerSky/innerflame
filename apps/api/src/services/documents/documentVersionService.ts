import { createSupabaseClient } from '@innerflame/utils/supabase.js';
import { createFullContent } from '../../utils/documentUtils.js';

/**
 * Extract document content from XML tags
 */
export function extractDocumentContent(text: string): string | null {
  const match = text.match(/<document_edit>\s*<content>([\s\S]*?)<\/content>\s*<\/document_edit>/i);
  return match ? match[1].trim() : null;
}

/**
 * Detect if a string contains document edit tags
 */
export function containsDocumentEditTags(text: string): boolean {
  return /<document_edit>/i.test(text);
}

/**
 * Create a new document version from AI edit
 */
export async function createAIEditVersion(
  documentId: string,
  newContent: string,
  userId: string
): Promise<{ success: boolean; versionNumber?: number; error?: string }> {
  const supabase = createSupabaseClient();
  const now = new Date().toISOString();
  
  try {
    // Get the existing entity to preserve metadata
    const { data: existingEntity, error: getError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (getError) throw getError;
    if (!existingEntity) throw new Error('Document not found');
    
    // Verify document ownership (security check)
    if (existingEntity.user_id !== userId) {
      throw new Error('Unauthorized document access');
    }
    
    // Get current version
    const { data: currentVersions, error: currentVersionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('entity_id', documentId)
      .eq('is_current', true);
      
    if (currentVersionError) throw currentVersionError;
    
    const currentVersion = currentVersions?.[0];
    const newVersionNumber = currentVersion ? currentVersion.version_number + 1 : 1;
    
    // Extract title from the document content
    // Most document content is stored as JSON with a title field
    let title = existingEntity.title;
    try {
      if (currentVersion?.full_content) {
        // Check if full_content is already an object or a string
        let contentObj;
        if (typeof currentVersion.full_content === 'string') {
          contentObj = JSON.parse(currentVersion.full_content);
        } else if (typeof currentVersion.full_content === 'object') {
          contentObj = currentVersion.full_content;
        }
        
        if (contentObj && contentObj.title) {
          title = contentObj.title; // Use the existing title
        }
      }
    } catch (e) {
      console.error('Error parsing current content:', e);
      // Continue with existing title if parsing fails
    }
    
    // Begin transaction
    // Mark previous version as not current
    if (currentVersion) {
      const { error: updateError } = await supabase
        .from('entity_versions')
        .update({ is_current: false })
        .eq('id', currentVersion.id);
        
      if (updateError) throw updateError;
    }
    
    // Create new version
    const { data: newVersion, error: newVersionError } = await supabase
      .from('entity_versions')
      .insert({
        entity_id: documentId,
        entity_type: existingEntity.entity_type,
        version_number: newVersionNumber,
        full_content: createFullContent(title, newContent),
        version_type: 'ai_edit',
        is_current: true,
        base_version_id: currentVersion?.id,
        created_at: now
      })
      .select()
      .single();
      
    if (newVersionError) throw newVersionError;
    
    // Update entity timestamp
    const { error: entityError } = await supabase
      .from('entities')
      .update({
        updated_at: now
      })
      .eq('id', documentId);
      
    if (entityError) throw entityError;
    
    return {
      success: true,
      versionNumber: newVersionNumber
    };
    
  } catch (error) {
    console.error('Error creating AI edit version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating document version'
    };
  }
} 