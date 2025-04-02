import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Message as MessageModel } from '@innerflame/types';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { MessageActions } from '../MessageActions.js';
import { MessageEditor } from '../MessageEditor.js';
import { LoadingDots } from '@/components/ui/loading-dots.js';
import { DocumentEditBubble } from './DocumentEditBubble.js';
import { 
  containsDocumentEditTags, 
  parseDocumentEdit, 
  DocumentEditTagState,
  createSafeDisplayText,
  parseMessageSegments,
  parseStreamingSegments,
  SegmentType
} from '../../utils/documentEditUtils.js';
import { DocumentVersionRestoreModal } from '../modals/DocumentVersionRestoreModal.js';
import { ConfirmRestoreModal } from '../modals/ConfirmRestoreModal.js';
import { documentRepository } from '../../repositories/documentRepository.js';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: MessageModel;
  messages: MessageModel[];
  messageIndex: number;
  isStreaming: boolean;
  streamingContent?: string;
  documentEditState?: DocumentEditTagState;
  isEditing: boolean;
  isEditingLoading: boolean;
  isEdited: boolean;
  isMobileScreen: boolean;
  isStandalone: boolean;
  onEdit: (messageId: string, content: string) => Promise<boolean | undefined>;
  onDelete: (messageId: string) => Promise<boolean | undefined>;
  onCancelEdit: () => void;
  onStartEdit: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  messages,
  messageIndex,
  isStreaming,
  streamingContent,
  documentEditState: propDocumentEditState,
  isEditing,
  isEditingLoading,
  isEdited,
  isMobileScreen,
  isStandalone,
  onEdit,
  onDelete,
  onCancelEdit,
  onStartEdit
}) => {
  const isUserMessage = String(message.sender_type) === 'user';
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [versionData, setVersionData] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [versionNumber, setVersionNumber] = useState<number | undefined>(undefined);
  
  // Determine whether to show restore version button
  const shouldShowRestoreVersion = useMemo(() => {
    if (!messages || messageIndex === undefined) return false;
    if (message.sender_type !== 'user') return false;
    if (messageIndex >= messages.length - 1) return false;
    
    // We should show the restore button on a user message when:
    // 1. It has a context_entity_version_id (meaning it was sent with a document version)
    // 2. The next message is from the assistant
    // 3. The next message has a different context_entity_version_id (meaning the document was changed)
    const nextMessage = messages[messageIndex + 1];
    return (
      message.context_entity_version_id !== null &&
      nextMessage.sender_type === 'assistant' && 
      nextMessage.context_entity_version_id !== message.context_entity_version_id &&
      nextMessage.context_entity_version_id !== null
    );
  }, [message, messages, messageIndex]);
  
  // Parse message into segments
  const messageSegments = useMemo(() => {
    // For user messages, don't segment
    if (isUserMessage) {
      return [{
        type: SegmentType.TEXT,
        content: message.content
      }];
    }
    
    // For streaming assistant messages
    if (isStreaming && streamingContent) {
      return parseStreamingSegments(streamingContent);
    }
    
    // For completed assistant messages
    if (message.content) {
      return parseMessageSegments(message.content);
    }
    
    return [];
  }, [isUserMessage, isStreaming, streamingContent, message.content]);
  
  // Memoize the renderSegment function to prevent recreating it on each render
  const renderSegment = useCallback((segment: any, index: number) => {
    if (segment.type === SegmentType.TEXT) {
      return (
        <div key={`segment-${index}`} className="mb-3 last:mb-0">
          <MarkdownRenderer 
            content={segment.content} 
            className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
          />
        </div>
      );
    } else if (segment.type === SegmentType.DOCUMENT_EDIT) {
      // Use state from prop if available, otherwise use the segment's state
      const editState = propDocumentEditState !== undefined 
        ? propDocumentEditState 
        : segment.editState || DocumentEditTagState.NONE;
      
      return (
        <div key={`segment-${index}`} className="mb-3 last:mb-0">
          <DocumentEditBubble 
            content={segment.content} 
            state={editState} 
          />
        </div>
      );
    }
    return null;
  }, [propDocumentEditState]); // Only recreate when propDocumentEditState changes
  
  // Handle save edit
  const handleSaveEdit = async (newContent: string) => {
    await onEdit(message.id, newContent);
  };

  // Handle restore version button click
  const handleRestoreVersion = async () => {
    if (!messages || messageIndex === undefined) return;
    
    // Use the current message's context_entity_version_id, not the next message's
    const versionId = message.context_entity_version_id;
    
    if (!versionId) return;
    
    try {
      setIsLoading(true);
      const version = await documentRepository.getVersionById(versionId);
      
      if (version) {
        // Store the version number
        setVersionNumber(version.version_number);
        
        if (version.content) {
          // The document content is nested within the version.content object
          // For LeanCanvas documents, content has a nested structure with title and content properties
          if (typeof version.content === 'object' && version.content !== null) {
            // Handle the DocumentContent structure with nested content field
            if ('content' in version.content && typeof version.content.content === 'string') {
              try {
                // Parse the nested content string which contains the actual lean canvas data
                const contentObj = JSON.parse(version.content.content);
                setVersionData(contentObj as Record<string, string>);
              } catch (e) {
                console.error('Failed to parse nested content string', e);
                setVersionData(null);
              }
            } else {
              // Use a proper type conversion with unknown as intermediate type
              const contentObj = version.content as unknown;
              setVersionData(contentObj as Record<string, string>);
            }
          } else if (typeof version.content === 'string') {
            try {
              // Try to parse if it's a JSON string
              setVersionData(JSON.parse(version.content));
            } catch (e) {
              console.error('Failed to parse version content', e);
              setVersionData(null);
            }
          }
          
          setShowRestoreModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching version', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle confirmation to restore
  const handleConfirmRestore = () => {
    setShowRestoreModal(false);
    setShowConfirmModal(true);
  };
  
  // Handle final confirmation (actual restoration would be implemented here)
  const handleFinalConfirm = () => {
    // The actual restoration logic would be implemented here
    // For now, we just close the modal
    setShowConfirmModal(false);
    
    // TODO: Implement the actual restoration logic
    console.log('Document version would be restored here');
  };

  // Add debugging useEffect to track component lifecycle
  useEffect(() => {
    // Component mounted
    return () => {
      // Component will unmount
    };
  }, [message.id]);

  return (
    <>
      <div
        className={`p-3 rounded-lg relative group ${
          isUserMessage
            ? 'bg-primary/10 ml-8 mr-0 pl-2'
            : 'bg-secondary/20 mr-8 ml-0 pr-2'
        }`}
      >
        {/* User messages with edit capability */}
        {isUserMessage && message.id !== `temp-${Date.now()}` && (
          <>
            {isEditing ? (
              /* Edit mode */
              <MessageEditor
                message={message}
                onSave={handleSaveEdit}
                onCancel={onCancelEdit}
                isLoading={isEditingLoading}
              />
            ) : (
              /* Display mode with actions */
              <>
                <MessageActions
                  message={message}
                  onEdit={onStartEdit}
                  onDelete={onDelete}
                  showRestoreVersion={shouldShowRestoreVersion}
                  onRestoreVersion={handleRestoreVersion}
                  isMobile={!isStandalone && isMobileScreen}
                  position="left"
                />
                <MarkdownRenderer 
                  content={message.content} 
                  className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                />
                {isEdited && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>(edited)</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        {/* Assistant messages (never editable) */}
        {!isUserMessage && (
          <>
            <MessageActions
              message={message}
              onEdit={onStartEdit}
              onDelete={onDelete}
              isMobile={!isStandalone && isMobileScreen}
              canEdit={false}
              position="right"
            />
            
            {/* Display segmented content */}
            {messageSegments.length > 0 ? (
              <div className="assistant-message-segments">
                {messageSegments.map(renderSegment)}
              </div>
            ) : (
              /* Fallback for when we have no segments */
              isStreaming ? (
                streamingContent ? (
                  <MarkdownRenderer 
                    content={createSafeDisplayText(streamingContent)} 
                    className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                  />
                ) : (
                  <LoadingDots />
                )
              ) : (
                <MarkdownRenderer 
                  content={message.content} 
                  className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                />
              )
            )}
          </>
        )}
      </div>
      
      {/* Document Version Restore Modal */}
      <DocumentVersionRestoreModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirmRestore={handleConfirmRestore}
        versionId={message.context_entity_version_id}
        versionNumber={versionNumber}
        versionData={versionData}
      />
      
      {/* Confirm Restore Modal */}
      <ConfirmRestoreModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleFinalConfirm}
        versionId={message.context_entity_version_id}
        versionNumber={versionNumber}
      />
    </>
  );
}; 