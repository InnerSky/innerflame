import React from 'react';
import { VersionHistoryModal } from './VersionHistoryModal.js';
import { DeleteConfirmationDialog, DiscardChangesDialog } from './ConfirmationDialogs.js';
import { CreateProjectDialog } from './CreateProjectDialog.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.js';
import { Button } from '@/components/ui/button.js';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';

type ModalContainerProps = {
  // Version history props
  showVersionModal: boolean;
  setShowVersionModal: (show: boolean) => void;
  viewingVersionIndex: number;
  setViewingVersionIndex: (index: number) => void;
  onActivateVersion: (version: any) => void;
  
  // Document deletion props
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  documentToDelete: any | null;
  onDeleteDocument: () => void;
  
  // Discard changes props
  showDiscardDialog: boolean;
  setShowDiscardDialog: (show: boolean) => void;
  onDiscardChanges: () => void;
  onSaveAndSwitch: () => Promise<void>;
  
  // Project edit props
  showProjectDialog: boolean;
  setShowProjectDialog: (show: boolean) => void;
  projectToEdit: { id: string; title: string; content: string } | null;
  onSaveProjectEdit: (title: string, content: string) => Promise<void>;
  
  // Project delete props
  showDeleteProjectDialog: boolean;
  setShowDeleteProjectDialog: (show: boolean) => void;
  onDeleteProject: () => void;
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
  // Version history props
  showVersionModal,
  setShowVersionModal,
  viewingVersionIndex,
  setViewingVersionIndex,
  onActivateVersion,
  
  // Document deletion props
  showDeleteDialog,
  setShowDeleteDialog,
  documentToDelete,
  onDeleteDocument,
  
  // Discard changes props
  showDiscardDialog,
  setShowDiscardDialog,
  onDiscardChanges,
  onSaveAndSwitch,
  
  // Project edit props
  showProjectDialog,
  setShowProjectDialog,
  projectToEdit,
  onSaveProjectEdit,
  
  // Project delete props
  showDeleteProjectDialog,
  setShowDeleteProjectDialog,
  onDeleteProject
}) => {
  const { selectedDocument, documentVersions } = useDocumentsContext();
  
  return (
    <>
      {/* Version history modal */}
      <VersionHistoryModal
        open={showVersionModal}
        onOpenChange={setShowVersionModal}
        versions={documentVersions}
        viewingIndex={viewingVersionIndex}
        onChangeIndex={setViewingVersionIndex}
        onActivateVersion={onActivateVersion}
      />
      
      {/* Document delete confirmation */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        document={documentToDelete}
        onConfirm={onDeleteDocument}
      />
      
      {/* Discard changes dialog */}
      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        documentTitle={selectedDocument?.title || ''}
        onDiscard={onDiscardChanges}
        onSaveAndSwitch={onSaveAndSwitch}
      />
      
      {/* Project edit dialog */}
      {projectToEdit && (
        <CreateProjectDialog
          open={showProjectDialog}
          onOpenChange={setShowProjectDialog}
          onCreateProject={onSaveProjectEdit}
          mode="edit"
          initialTitle={projectToEdit.title}
          initialContent={projectToEdit.content}
        />
      )}
      
      {/* Project delete confirmation */}
      <Dialog 
        open={showDeleteProjectDialog} 
        onOpenChange={setShowDeleteProjectDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this project? This will also delete all documents in this project. This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteProjectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDeleteProject}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 