import { createSupabaseClient } from '@innerflame/utils/supabase.js';
import { createFullContent } from '../../utils/documentUtils.js';

/**
 * Accept an AI-edited document version
 * This changes the approval_status from 'pending_approval' to 'accepted'
 */
export async function acceptVersion(
  versionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseClient();
  
  try {
    // First verify ownership
    const { data: version, error: versionError } = await supabase
      .from('entity_versions')
      .select('entity_id')
      .eq('id', versionId)
      .single();
      
    if (versionError) throw versionError;
    if (!version) throw new Error('Version not found');
    
    // Verify ownership
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('user_id')
      .eq('id', version.entity_id)
      .single();
      
    if (entityError) throw entityError;
    if (!entity) throw new Error('Document not found');
    
    // Security check
    if (entity.user_id !== userId) {
      throw new Error('Unauthorized document access');
    }
    
    // Update version status
    const { error: updateError } = await supabase
      .from('entity_versions')
      .update({ approval_status: 'accepted' })
      .eq('id', versionId);
      
    if (updateError) throw updateError;
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error accepting version'
    };
  }
}

/**
 * Reject an AI-edited document version
 * This marks the version as rejected and restores the previous version
 */
export async function rejectVersion(
  versionId: string,
  userId: string
): Promise<{ success: boolean; restoredVersionId?: string; error?: string }> {
  const supabase = createSupabaseClient();
  const now = new Date().toISOString();
  
  try {
    // Get the version to reject
    const { data: version, error: versionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('id', versionId)
      .single();
      
    if (versionError) throw versionError;
    if (!version) throw new Error('Version not found');
    
    // Verify document ownership
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', version.entity_id)
      .single();
      
    if (entityError) throw entityError;
    if (!entity) throw new Error('Document not found');
    
    // Security check
    if (entity.user_id !== userId) {
      throw new Error('Unauthorized document access');
    }
    
    // Get the base version (previous version)
    if (!version.base_version_id) {
      throw new Error('Cannot reject version with no base version');
    }
    
    const { data: baseVersion, error: baseVersionError } = await supabase
      .from('entity_versions')
      .select('*')
      .eq('id', version.base_version_id)
      .single();
      
    if (baseVersionError) throw baseVersionError;
    if (!baseVersion) throw new Error('Base version not found');
    
    // Begin transaction for version management
    
    // 1. Mark the rejected version as rejected and not current
    const { error: updateRejectedError } = await supabase
      .from('entity_versions')
      .update({ 
        is_current: false,
        approval_status: 'rejected'
      })
      .eq('id', versionId);
      
    if (updateRejectedError) throw updateRejectedError;
    
    // 2. Get highest version number to create a new restore version
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
    
    // 3. Create a new restore version based on the base version
    const { data: restoredVersion, error: restoreError } = await supabase
      .from('entity_versions')
      .insert({
        entity_id: version.entity_id,
        entity_type: entity.entity_type,
        version_number: newVersionNumber,
        full_content: baseVersion.full_content,
        version_type: 'restore',
        is_current: true,
        base_version_id: baseVersion.id,
        created_at: now,
        approval_status: 'accepted'  // Auto-approve restore versions
      })
      .select()
      .single();
      
    if (restoreError) throw restoreError;
    
    // 4. Update entity active version to the restored version
    const { error: entityUpdateError } = await supabase
      .from('entities')
      .update({
        active_version_id: restoredVersion.id,
        updated_at: now
      })
      .eq('id', version.entity_id);
      
    if (entityUpdateError) throw entityUpdateError;
    
    return { 
      success: true,
      restoredVersionId: restoredVersion.id 
    };
  } catch (error) {
    console.error('Error rejecting version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error rejecting version'
    };
  }
}