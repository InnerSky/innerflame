/**
 * Utilities for handling document edit XML tags in streamed content
 */

/**
 * Document edit tag state for tracking parsing progress
 */
export enum DocumentEditTagState {
  NONE = 'none',                  // No document edit tags detected
  WAITING = 'waiting',            // Opening tag detected, waiting for content
  CONTENT_STARTED = 'content',    // Content tag detected, accumulating content
  COMPLETED = 'completed'         // Closing tag detected, edit is complete
}

/**
 * Interface for document edit data extracted from tags
 */
export interface DocumentEditData {
  state: DocumentEditTagState;
  content: string;
  originalText: string;          // Original text including the tags
  isComplete: boolean;           // Whether the edit is complete
}

/**
 * Types of message segments
 */
export enum SegmentType {
  TEXT = 'text',                  // Regular text content
  DOCUMENT_EDIT = 'document_edit' // Document edit content
}

/**
 * Interface for a message segment
 */
export interface MessageSegment {
  type: SegmentType;
  content: string;
  editState?: DocumentEditTagState;
}

/**
 * Regular expressions for detecting document edit tags
 */
const DOCUMENT_EDIT_START_REGEX = /<(document_edit|write_to_file|replace_in_file)>/i;
const DOCUMENT_EDIT_END_REGEX = /<\/(document_edit|write_to_file|replace_in_file)>/i;
const CONTENT_START_REGEX = /<content>/i;
const CONTENT_END_REGEX = /<\/content>/i;

/**
 * Detects if a string contains document edit tags
 */
export function containsDocumentEditTags(text: string): boolean {
  return DOCUMENT_EDIT_START_REGEX.test(text);
}

/**
 * Extracts document content from between <content> tags
 */
export function extractDocumentContent(text: string): string | null {
  // Check all tag formats in priority order
  if (text.includes('<write_to_file>')) {
    const contentMatch = text.match(/<write_to_file>[\s\S]*?<content>([\s\S]*?)<\/content>[\s\S]*?<\/write_to_file>/i);
    return contentMatch ? contentMatch[1] : null;
  } else if (text.includes('<replace_in_file>')) {
    const contentMatch = text.match(/<replace_in_file>[\s\S]*?<content>([\s\S]*?)<\/content>[\s\S]*?<\/replace_in_file>/i);
    return contentMatch ? contentMatch[1] : null;
  } else {
    const contentMatch = text.match(/<document_edit>[\s\S]*?<content>([\s\S]*?)<\/content>[\s\S]*?<\/document_edit>/i);
    return contentMatch ? contentMatch[1] : null;
  }
}

/**
 * Parses a streaming chunk of text to detect document edit tags and extract content
 */
export function parseDocumentEdit(text: string): DocumentEditData {
  if (!text) {
    return { 
      state: DocumentEditTagState.NONE, 
      content: '', 
      originalText: text,
      isComplete: false 
    };
  }

  // Check for document edit tags
  const hasOpeningTag = DOCUMENT_EDIT_START_REGEX.test(text);
  const hasClosingTag = DOCUMENT_EDIT_END_REGEX.test(text);
  
  if (!hasOpeningTag) {
    return { 
      state: DocumentEditTagState.NONE, 
      content: '', 
      originalText: text,
      isComplete: false 
    };
  }

  // More aggressive content tag detection for streaming
  // Use string search instead of regex for better performance and partial tag detection
  const hasContentOpeningTag = text.includes('<content>');
  const hasContentClosingTag = text.includes('</content>');
  
  // Extract content if content opening tag is present
  let content = '';
  if (hasContentOpeningTag) {
    // For partial content (no closing tag yet), extract everything after opening tag
    if (!hasContentClosingTag) {
      const contentStartIndex = text.indexOf('<content>') + '<content>'.length;
      content = text.substring(contentStartIndex);
    } else {
      // Complete content with closing tag
      const contentMatch = extractDocumentContent(text);
      content = contentMatch || '';
    }
  }

  // Determine the state - prioritize state detection
  let state: DocumentEditTagState;
  if (hasClosingTag) {
    state = DocumentEditTagState.COMPLETED;
  } else if (hasContentOpeningTag) {
    // Force content started state as soon as we see the opening content tag
    state = DocumentEditTagState.CONTENT_STARTED;
  } else {
    state = DocumentEditTagState.WAITING;
  }

  return {
    state,
    content,
    originalText: text,
    isComplete: hasClosingTag
  };
}

/**
 * Transforms document edit text to be displayed in UI
 * This removes the XML tags for cleaner display
 */
export function formatDocumentEditForDisplay(text: string): string {
  if (!text) return '';
  
  // If content is available, extract and return it
  const content = extractDocumentContent(text);
  if (content) {
    return content;
  }
  
  // Otherwise, return the text with tags removed
  return text
    .replace(DOCUMENT_EDIT_START_REGEX, '')
    .replace(DOCUMENT_EDIT_END_REGEX, '')
    .replace(CONTENT_START_REGEX, '')
    .replace(CONTENT_END_REGEX, '')
    .trim();
}

/**
 * Creates a safe display text from document edit
 * Ensures we don't show partial tags that look weird in the UI
 */
export function createSafeDisplayText(text: string): string {
  if (!text) return '';
  
  const editData = parseDocumentEdit(text);
  
  if (editData.state === DocumentEditTagState.NONE) {
    return text;
  }
  
  if (editData.state === DocumentEditTagState.WAITING) {
    return 'Preparing document edit...';
  }
  
  if (editData.content) {
    return editData.content;
  }
  
  return 'Processing document edit...';
}

/**
 * Extracts a complete document edit block from a text
 * Returns the matched text and its start/end indices
 */
export function extractDocumentEditBlock(text: string, startFrom = 0): { 
  match: string; 
  start: number; 
  end: number 
} | null {
  // First check for write_to_file tags
  const writeToFileStartIndex = text.indexOf('<write_to_file>', startFrom);
  if (writeToFileStartIndex !== -1) {
    const writeToFileEndIndex = text.indexOf('</write_to_file>', writeToFileStartIndex);
    if (writeToFileEndIndex !== -1) {
      const endPosition = writeToFileEndIndex + '</write_to_file>'.length;
      return {
        match: text.substring(writeToFileStartIndex, endPosition),
        start: writeToFileStartIndex,
        end: endPosition
      };
    }
  }
  
  // Then check for replace_in_file tags
  const replaceInFileStartIndex = text.indexOf('<replace_in_file>', startFrom);
  if (replaceInFileStartIndex !== -1) {
    const replaceInFileEndIndex = text.indexOf('</replace_in_file>', replaceInFileStartIndex);
    if (replaceInFileEndIndex !== -1) {
      const endPosition = replaceInFileEndIndex + '</replace_in_file>'.length;
      return {
        match: text.substring(replaceInFileStartIndex, endPosition),
        start: replaceInFileStartIndex,
        end: endPosition
      };
    }
  }
  
  // Fall back to document_edit tags
  const startTagIndex = text.indexOf('<document_edit>', startFrom);
  if (startTagIndex === -1) return null;
  
  const endTagIndex = text.indexOf('</document_edit>', startTagIndex);
  if (endTagIndex === -1) return null;
  
  const endPosition = endTagIndex + '</document_edit>'.length;
  
  return {
    match: text.substring(startTagIndex, endPosition),
    start: startTagIndex,
    end: endPosition
  };
}

/**
 * Parses a message into segments of text and document edits
 * This allows rendering mixed content with both regular text and document edits
 */
export function parseMessageSegments(text: string): MessageSegment[] {
  if (!text) return [];
  
  // If no document edit tags are found, return the entire text as a single segment
  if (!containsDocumentEditTags(text)) {
    return [{
      type: SegmentType.TEXT,
      content: text
    }];
  }
  
  const segments: MessageSegment[] = [];
  let currentPosition = 0;
  
  // Process the text until we've covered it all
  while (currentPosition < text.length) {
    // Find the next document edit block
    const editBlock = extractDocumentEditBlock(text, currentPosition);
    
    // If no more edit blocks found, add the rest as text
    if (!editBlock) {
      const remainingText = text.substring(currentPosition);
      if (remainingText.trim()) {
        segments.push({
          type: SegmentType.TEXT,
          content: remainingText
        });
      }
      break;
    }
    
    // Add text before this edit block, if any
    if (editBlock.start > currentPosition) {
      const textBefore = text.substring(currentPosition, editBlock.start);
      if (textBefore.trim()) {
        segments.push({
          type: SegmentType.TEXT,
          content: textBefore
        });
      }
    }
    
    // Process and add the document edit block
    const docEditText = editBlock.match;
    const editData = parseDocumentEdit(docEditText);
    
    segments.push({
      type: SegmentType.DOCUMENT_EDIT,
      content: editData.content || formatDocumentEditForDisplay(docEditText),
      editState: editData.state
    });
    
    // Update position to after this edit block
    currentPosition = editBlock.end;
  }
  
  return segments;
}

/**
 * Similar to parseMessageSegments but designed for streaming content
 * Handles incomplete or partial document edit tags more gracefully
 */
export function parseStreamingSegments(text: string): MessageSegment[] {
  if (!text) return [];
  
  // If there are no opening document edit tags, return as a single text segment
  if (!containsDocumentEditTags(text)) {
    return [{
      type: SegmentType.TEXT,
      content: text
    }];
  }
  
  const segments: MessageSegment[] = [];
  let currentPosition = 0;
  let foundIncompleteBlock = false;
  
  // Process complete document edit blocks
  while (currentPosition < text.length && !foundIncompleteBlock) {
    const editBlock = extractDocumentEditBlock(text, currentPosition);
    
    // If no more complete edit blocks found
    if (!editBlock) {
      // Look for an incomplete block (has opening tag but no closing tag)
      // Check for all tag formats
      const lastDocEditIndex = text.lastIndexOf('<document_edit>', text.length);
      const lastWriteToFileIndex = text.lastIndexOf('<write_to_file>', text.length);
      const lastReplaceInFileIndex = text.lastIndexOf('<replace_in_file>', text.length);
      
      // Find the most recent opening tag
      const lastOpeningTagIndex = Math.max(
        lastDocEditIndex !== -1 ? lastDocEditIndex : -1,
        lastWriteToFileIndex !== -1 ? lastWriteToFileIndex : -1,
        lastReplaceInFileIndex !== -1 ? lastReplaceInFileIndex : -1
      );
      
      let tagType = 'document_edit';
      if (lastOpeningTagIndex === lastWriteToFileIndex) tagType = 'write_to_file';
      if (lastOpeningTagIndex === lastReplaceInFileIndex) tagType = 'replace_in_file';
      
      if (lastOpeningTagIndex !== -1 && lastOpeningTagIndex >= currentPosition) {
        // Add text before the incomplete block
        if (lastOpeningTagIndex > currentPosition) {
          const textBefore = text.substring(currentPosition, lastOpeningTagIndex);
          if (textBefore.trim()) {
            segments.push({
              type: SegmentType.TEXT,
              content: textBefore
            });
          }
        }
        
        // Add the incomplete block
        const incompleteText = text.substring(lastOpeningTagIndex);
        // Use updated parseDocumentEdit that handles partial content tags
        const editData = parseDocumentEdit(incompleteText);
        
        segments.push({
          type: SegmentType.DOCUMENT_EDIT,
          content: editData.content || formatDocumentEditForDisplay(incompleteText),
          editState: editData.state
        });
        
        foundIncompleteBlock = true;
      } else {
        // No incomplete block, just add the rest as text
        const remainingText = text.substring(currentPosition);
        if (remainingText.trim()) {
          segments.push({
            type: SegmentType.TEXT,
            content: remainingText
          });
        }
      }
      
      break;
    }
    
    // Add text before this edit block, if any
    if (editBlock.start > currentPosition) {
      const textBefore = text.substring(currentPosition, editBlock.start);
      if (textBefore.trim()) {
        segments.push({
          type: SegmentType.TEXT,
          content: textBefore
        });
      }
    }
    
    // Process and add the document edit block
    const docEditText = editBlock.match;
    const editData = parseDocumentEdit(docEditText);
    
    segments.push({
      type: SegmentType.DOCUMENT_EDIT,
      content: editData.content || formatDocumentEditForDisplay(docEditText),
      editState: editData.state
    });
    
    // Update position to after this edit block
    currentPosition = editBlock.end;
  }
  
  return segments;
} 