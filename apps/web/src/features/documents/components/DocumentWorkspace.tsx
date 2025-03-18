import React, { useState, useEffect, useRef } from 'react';
import { DocumentEditor } from './DocumentEditor.js';
import { ChatInterface } from './ChatInterface.js';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { DocumentType } from '../models/document.js';
import { DocumentTabBar, DocumentTabView } from './DocumentTabBar.js';
import { motion } from 'framer-motion';
import { ProjectInfo, ProjectInfoRefType } from './ProjectInfo.js';

type DocumentWorkspaceProps = {
  isMobile?: boolean;
  className?: string;
  onCreateNew: () => void;
  projectActionMenu?: React.ReactNode;
  onProjectInfoRefCreated?: (ref: React.RefObject<ProjectInfoRefType>) => void;
};

export const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({
  isMobile = false,
  className = '',
  onCreateNew,
  projectActionMenu,
  onProjectInfoRefCreated
}) => {
  const {
    selectedDocument,
    selectedProjectId,
    title,
    content,
    isPreviewMode,
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    contentFormat,
    saveDocument,
    setTitle,
    setContent,
    togglePreviewMode,
    updateDocumentType,
    updateContentFormat,
    handleVersionHistoryClick
  } = useDocumentsContext();

  // Create a ref for ProjectInfo to refresh after project edits
  const projectInfoRef = useRef<ProjectInfoRefType>(null);

  // Share the ref with parent components if needed
  useEffect(() => {
    if (onProjectInfoRefCreated) {
      onProjectInfoRefCreated(projectInfoRef);
    }
  }, [onProjectInfoRefCreated]);

  // State for mobile tab view
  const [activeTab, setActiveTab] = useState<DocumentTabView>('document');
  
  // Reset to document tab whenever document or project selection changes
  useEffect(() => {
    if (isMobile) {
      setActiveTab('document');
    }
  }, [selectedDocument, selectedProjectId, isMobile]);

  // Handle mobile swipe gesture - moved to the top before conditional returns
  const handleSwipe = (direction: number) => {
    if (direction > 0 && activeTab === 'chat') {
      setActiveTab('document'); // This will be "document" or "project" depending on mode
    } else if (direction < 0 && activeTab === 'document') {
      setActiveTab('chat');
    }
  };

  // Chat component is common in both document and project modes
  const ChatComponent = <ChatInterface isStandalone={isMobile} className={isMobile ? "h-full" : "mt-0"} />;

  // If no document but project is selected, show project info with chat
  if (!selectedDocument && selectedProjectId) {
    // In desktop mode
    if (!isMobile) {
      return (
        <div className={`flex-grow flex ${className}`}>
          <div className="flex-1 min-w-[350px] pr-4">
            <ProjectInfo 
              ref={projectInfoRef}
              onCreateNew={onCreateNew} 
              projectActionMenu={projectActionMenu}
              className="h-full" 
            />
          </div>
          <div className="w-96 flex-shrink-0">
            {ChatComponent}
          </div>
        </div>
      );
    }

    // In mobile mode
    return (
      <div className={`flex flex-col h-full overflow-hidden ${className}`}>
        <DocumentTabBar 
          activeView={activeTab} 
          onChangeView={setActiveTab}
          isProjectMode={true}
        />
        <motion.div 
          className="flex flex-1 overflow-hidden relative"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 100) {
              handleSwipe(info.offset.x);
            }
          }}
        >
          <motion.div
            className="absolute inset-0 w-full h-full overflow-hidden"
            initial={false}
            animate={{ 
              x: activeTab === 'document' ? 0 : '-100%' 
            }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <ProjectInfo 
              ref={projectInfoRef}
              onCreateNew={onCreateNew} 
              projectActionMenu={projectActionMenu}
              className="h-full" 
            />
          </motion.div>
          <motion.div
            className="absolute inset-0 w-full h-full overflow-hidden"
            initial={false}
            animate={{ 
              x: activeTab === 'chat' ? 0 : '100%' 
            }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {ChatComponent}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // If no document and no project is selected, return null
  if (!selectedDocument) {
    return null;
  }

  // Editor component with props
  const EditorComponent = (
    <DocumentEditor
      title={title}
      content={content}
      isPreviewMode={isPreviewMode}
      saveStatus={saveStatus}
      lastSaved={lastSaved}
      versionNumber={selectedDocument.versionNumber}
      hasUnsavedChanges={hasUnsavedChanges}
      documentType={selectedDocument.entityType as DocumentType}
      contentFormat={contentFormat as any}
      onTitleChange={setTitle}
      onContentChange={setContent}
      onTogglePreview={togglePreviewMode}
      onSave={saveDocument}
      onVersionHistoryClick={handleVersionHistoryClick}
      onDocumentTypeChange={updateDocumentType}
      onContentFormatChange={updateContentFormat}
    />
  );

  // Desktop layout - side by side
  if (!isMobile) {
    return (
      <div className={`flex-grow flex ${className}`}>
        <div className="flex-1 min-w-[350px] pr-4">
          {EditorComponent}
        </div>
        <div className="w-96 flex-shrink-0">
          {ChatComponent}
        </div>
      </div>
    );
  }

  // Mobile layout - tabbed interface with swipe
  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <DocumentTabBar 
        activeView={activeTab} 
        onChangeView={setActiveTab}
        isProjectMode={false}
      />
      <motion.div 
        className="flex flex-1 overflow-hidden relative"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 100) {
            handleSwipe(info.offset.x);
          }
        }}
      >
        <motion.div
          className="absolute inset-0 w-full h-full overflow-hidden"
          initial={false}
          animate={{ 
            x: activeTab === 'document' ? 0 : '-100%' 
          }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          {EditorComponent}
        </motion.div>
        <motion.div
          className="absolute inset-0 w-full h-full overflow-hidden"
          initial={false}
          animate={{ 
            x: activeTab === 'chat' ? 0 : '100%' 
          }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          {ChatComponent}
        </motion.div>
      </motion.div>
    </div>
  );
}; 