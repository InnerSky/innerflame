import { createSupabaseClient } from '@innerflame/utils/supabase.js';
import { createFullContent } from '../../utils/documentUtils.js';

/**
 * Extract document content from XML tags
 */
export function extractDocumentContent(text: string): string | null {
  // Check for new write_to_file format first
  const writeToFileMatch = text.match(/<write_to_file>\s*<content>([\s\S]*?)<\/content>\s*<\/write_to_file>/i);
  if (writeToFileMatch) {
    return writeToFileMatch[1].trim();
  }
  
  // Check for replace_in_file format
  const replaceInFileMatch = text.match(/<replace_in_file>\s*<diff>([\s\S]*?)<\/diff>\s*<\/replace_in_file>/i);
  if (replaceInFileMatch) {
    return replaceInFileMatch[1].trim();
  }
  
  // Fallback to old document_edit format for backward compatibility
  const documentEditMatch = text.match(/<document_edit>\s*<content>([\s\S]*?)<\/content>\s*<\/document_edit>/i);
  return documentEditMatch ? documentEditMatch[1].trim() : null;
}

/**
 * Extract all diff blocks from replace_in_file tags
 */
export function extractDiffBlocks(text: string): string[] {
  const diffBlocks: string[] = [];
  const regex = /<replace_in_file>\s*<diff>([\s\S]*?)<\/diff>\s*<\/replace_in_file>/gi;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    diffBlocks.push(match[1].trim());
  }
  
  return diffBlocks;
}

/**
 * Process a single search/replace diff block
 * Returns the new content after applying the replacement
 */
export function processSearchReplace(content: string, diffBlock: string): string {
  // Parse the diff block to extract search and replace sections
  const searchMatch = diffBlock.match(/<<<<<<< SEARCH\s*([\s\S]*?)=======\s*/);
  const replaceMatch = diffBlock.match(/=======\s*([\s\S]*?)>>>>>>> REPLACE/);
  
  if (!searchMatch || !replaceMatch) {
    console.warn('Invalid diff block format:', diffBlock);
    return content;
  }
  
  const searchText = searchMatch[1];
  const replaceText = replaceMatch[1];
  
  // Perform the replacement
  // Using a simple string replacement approach
  if (content.includes(searchText)) {
    return content.replace(searchText, replaceText);
  } else {
    console.warn('Search text not found in content:', searchText);
    return content; // Return unchanged if search text not found
  }
}

/**
 * Applies all search/replace operations from replace_in_file tags
 */
export function applyDiffBlocks(originalContent: string, fullResponse: string): string {
  // Check if the response contains replace_in_file tags
  if (!fullResponse.includes('<replace_in_file>')) {
    return originalContent;
  }
  
  // Extract all diff blocks from the response
  const diffBlocks = extractDiffBlocks(fullResponse);
  
  // Apply each diff block in sequence
  let updatedContent = originalContent;
  for (const diffBlock of diffBlocks) {
    updatedContent = processSearchReplace(updatedContent, diffBlock);
  }
  
  return updatedContent;
}

/**
 * Detect if a string contains document edit tags
 */
export function containsDocumentEditTags(text: string): boolean {
  // Check for any of the tag formats
  return /<write_to_file>/i.test(text) || 
         /<document_edit>/i.test(text) || 
         /<replace_in_file>/i.test(text);
}

/**
 * Create a new document version from AI edit
 */
export async function createAIEditVersion(
  documentId: string,
  newContent: string,
  userId: string,
  fullResponse?: string
): Promise<{ success: boolean; versionNumber?: number; versionId?: string; error?: string }> {
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
    let currentContent = '';
    
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
        
        if (contentObj && contentObj.content) {
          currentContent = contentObj.content; // Extract current content for diff processing
        }
      }
    } catch (e) {
      console.error('Error parsing current content:', e);
      // Continue with existing title if parsing fails
    }
    
    // Process diff blocks if fullResponse is provided and contains replace_in_file tags
    let finalContent = newContent;
    if (fullResponse && fullResponse.includes('<replace_in_file>') && currentContent) {
      // For replace_in_file tags, we need to apply the diffs to the current content
      finalContent = applyDiffBlocks(currentContent, fullResponse);
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
        full_content: createFullContent(title, finalContent),
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
      versionNumber: newVersionNumber,
      versionId: newVersion.id // Return the ID of the newly created version
    };
    
  } catch (error) {
    console.error('Error creating AI edit version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating document version'
    };
  }
} 