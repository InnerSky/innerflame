import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DocumentList } from '../components/DocumentList';
import { DocumentEditor } from '../components/DocumentEditor';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { DeleteConfirmationDialog, DiscardChangesDialog } from '../components/ConfirmationDialogs';
import { ProjectSelector } from '../components/ProjectSelector';
import { CreateProjectDialog } from '../components/CreateProjectDialog';
import { 
  File, 
  FilePlus, 
  Clock, 
  List, 
  FileText, 
  Search, 
  XCircle, 
  AlertCircle,
  ArrowUpDown,
  Home,
  FolderPlus,
  X,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from '@/components/Spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DocumentTypeSelector } from '../components/DocumentTypeSelector';
import { DocumentType } from '../models/document';
import { DocumentRepository } from '../repositories/documentRepository';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Create a hook for media queries
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Update state based on media query
    const updateMatches = (e: MediaQueryListEvent | MediaQueryList) => {
      setMatches(e.matches);
    };
    
    // Initial check
    updateMatches(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', updateMatches);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);
  
  return matches;
};

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Project edit/delete states
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<{id: string, title: string, content: string} | null>(null);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  // For forcing ProjectSelector to update
  const [projectSelectorKey, setProjectSelectorKey] = useState(0);
  
  const {
    documents,
    filteredDocuments,
    selectedDocument,
    title,
    content,
    isPreviewMode,
    saveStatus,
    loading,
    error,
    lastSaved,
    searchQuery,
    sortDirection,
    documentVersions,
    viewingVersionIndex,
    showVersionModal,
    showDeleteDialog,
    showDiscardDialog,
    documentToDelete,
    documentType,
    contentFormat,
    selectedProjectId,
    
    setTitle,
    setContent,
    setSearchQuery,
    setViewingVersionIndex,
    setShowVersionModal,
    setShowDeleteDialog,
    setShowDiscardDialog,
    setDocumentType,
    
    fetchDocuments,
    createNewDocument,
    saveDocument,
    selectDocument,
    handleDiscardChanges,
    deleteDocument,
    confirmDeleteDocument,
    duplicateDocument,
    fetchDocumentVersions,
    activateVersion,
    togglePreviewMode,
    clearSearch,
    toggleSort,
    hasUnsavedChanges,
    updateDocumentType,
    updateContentFormat,
    selectProject,
    createNewProject,
    setDocumentProject,
  } = useDocuments(user?.id);
  
  // Memoize the hasUnsavedChanges value for proper reactivity
  const documentHasUnsavedChanges = useMemo(() => {
    return hasUnsavedChanges();
  }, [hasUnsavedChanges, title, content]);
  
  // Toggle drawer (mobile)
  const toggleDrawer = () => {
    setDrawerOpen(prev => !prev);
  };
  
  // Open drawer (mobile)
  const openDrawer = useCallback(() => {
    if (isMobile && !drawerOpen) {
      setDrawerOpen(true);
    }
  }, [isMobile, drawerOpen]);
  
  // Wrapper for project selection that also opens the drawer
  const handleSelectProject = useCallback((projectId: string | null) => {
    selectProject(projectId);
    // Open the drawer to show documents in the selected project
    openDrawer();
  }, [selectProject, openDrawer]);
  
  // Go to home
  const goToHome = () => {
    navigate('/');
  };
  
  // Save and switch document
  const handleSaveAndSwitch = async () => {
    await saveDocument();
    handleDiscardChanges();
  };
  
  // Project actions
  const handleEditProject = useCallback(async () => {
    if (!selectedProjectId || selectedProjectId === 'default_project' || !user?.id) return;
    
    try {
      // First get the project details
      const repository = new DocumentRepository();
      const projects = await repository.getUserProjectsOnly(user.id);
      const project = projects.find(p => p.id === selectedProjectId);
      
      if (project) {
        setProjectToEdit({
          id: project.id,
          title: project.title,
          content: project.content
        });
        setShowProjectDialog(true);
      }
    } catch (error) {
      console.error('Error loading project for edit:', error);
    }
  }, [selectedProjectId, user?.id]);
  
  const handleSaveProjectEdit = useCallback(async (title: string, content: string) => {
    if (!projectToEdit || !user?.id) return;
    
    try {
      const repository = new DocumentRepository();
      await repository.saveDocument(projectToEdit.id, title, content);
      
      // Refresh project data
      const projects = await repository.getUserProjectsOnly(user.id);
      const projectMap = projects.reduce((acc, project) => {
        acc[project.id] = project.title;
        return acc;
      }, {} as Record<string, string>);
      
      setProjectsData(projectMap);
      setProjectToEdit(null);
      
      // Force ProjectSelector to re-render with updated data
      setProjectSelectorKey(prev => prev + 1);
      
      // Additional handling if successful
      console.log('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }, [projectToEdit, user?.id]);
  
  const handleDeleteProject = useCallback(() => {
    if (!selectedProjectId || selectedProjectId === 'default_project') return;
    
    setProjectToDelete(selectedProjectId);
    setShowDeleteProjectDialog(true);
  }, [selectedProjectId]);
  
  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete || !user?.id) {
      setShowDeleteProjectDialog(false);
      return;
    }
    
    try {
      const repository = new DocumentRepository();
      
      // Delete all documents in this project first
      const projectDocs = await repository.getDocumentsByProject(user.id, projectToDelete);
      for (const doc of projectDocs) {
        await repository.deleteDocument(doc.id);
      }
      
      // Then delete the project itself
      await repository.deleteDocument(projectToDelete);
      
      // Go back to all documents view
      selectProject(null);
      
      // Refresh documents list
      fetchDocuments();
      
      // Refresh projects data for the project selector
      const projects = await repository.getUserProjectsOnly(user.id);
      const projectMap = projects.reduce((acc, project) => {
        acc[project.id] = project.title;
        return acc;
      }, {} as Record<string, string>);
      setProjectsData(projectMap);
      
      // Force ProjectSelector to re-render with updated data
      setProjectSelectorKey(prev => prev + 1);
      
      // Tell the user about successful deletion
      console.log('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setShowDeleteProjectDialog(false);
      setProjectToDelete(null);
    }
  }, [projectToDelete, user?.id, fetchDocuments, selectProject]);
  
  useEffect(() => {
    // Ensure no drawer is visible by default on mobile
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);
  
  // Add a wrapper function for fetchDocumentVersions
  const handleVersionHistoryClick = useCallback(() => {
    if (selectedDocument?.id) {
      fetchDocumentVersions(selectedDocument.id);
      setShowVersionModal(true);
    }
  }, [selectedDocument, fetchDocumentVersions]);
  
  // Add wrapper function for createNewProject to handle no arguments case
  const handleCreateNewProject = useCallback(async (title: string, content: string) => {
    const newProject = await createNewProject(title, content);
    
    // Update the projectsData with the new project if it was created successfully
    if (newProject && newProject.id) {
      setProjectsData(prevData => ({
        ...prevData,
        [newProject.id]: title
      }));
    }
    
    return newProject;
  }, [createNewProject]);
  
  // Add state to track project names for better header display
  const [projectsData, setProjectsData] = useState<Record<string, string>>({});
  
  // Load project names for header display
  useEffect(() => {
    const loadProjectNames = async () => {
      if (!user?.id) return;
      
      try {
        const repository = new DocumentRepository();
        const projects = await repository.getUserProjectsOnly(user.id);
        
        // Create a mapping of project IDs to names
        const projectMap = projects.reduce((acc, project) => {
          acc[project.id] = project.title;
          return acc;
        }, {} as Record<string, string>);
        
        setProjectsData(projectMap);
      } catch (error) {
        console.error('Error loading project names:', error);
      }
    };
    
    loadProjectNames();
  }, [user?.id]);
  
  // Project Actions Menu component
  const ProjectActionMenu = useCallback(() => {
    // Only show for actual projects (not All Documents or Default Project)
    if (!selectedProjectId || selectedProjectId === 'default_project') {
      return null;
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Project actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditProject}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteProject} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, [selectedProjectId, handleEditProject, handleDeleteProject]);
  
  // Get the header title based on selected project
  const getHeaderTitle = useCallback(() => {
    if (!selectedProjectId) {
      return "All Documents";
    } else if (selectedProjectId === 'default_project') {
      return "Default Project";
    } else {
      // Use the project name from our mapping
      return projectsData[selectedProjectId] || "Loading...";
    }
  }, [selectedProjectId, projectsData]);
  
  // Desktop layout
  if (!isMobile) {
    return (
      <div className="flex flex-col min-h-screen py-6">
        <header className="px-4 md:px-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <ProjectSelector 
                key={projectSelectorKey}
                userId={user?.id}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateNewProject}
              />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={goToHome}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </header>
        
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          // Desktop layout
          <div className="flex flex-1 container max-w-screen-2xl mx-auto">
            <div className="w-80 flex-shrink-0 overflow-hidden border-r flex flex-col h-[calc(100vh-140px)]">
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{getHeaderTitle()}</h2>
                  <ProjectActionMenu />
                </div>
                <DocumentList
                  documents={filteredDocuments}
                  selectedDocument={selectedDocument}
                  searchQuery={searchQuery}
                  sortDirection={sortDirection}
                  onSearch={setSearchQuery}
                  onClearSearch={clearSearch}
                  onToggleSort={toggleSort}
                  onSelectDocument={selectDocument}
                  onDuplicate={duplicateDocument}
                  onDelete={confirmDeleteDocument}
                  userId={user?.id}
                  onAssignToProject={setDocumentProject}
                  onCreateNew={createNewDocument}
                  currentProjectId={selectedProjectId}
                />
              </div>
            </div>
            
            <div className="flex-grow px-4 md:px-8 py-6 flex flex-col">
              {selectedDocument ? (
                <DocumentEditor
                  title={title}
                  content={content}
                  isPreviewMode={isPreviewMode}
                  saveStatus={saveStatus}
                  lastSaved={lastSaved}
                  versionNumber={selectedDocument.versionNumber}
                  hasUnsavedChanges={documentHasUnsavedChanges}
                  documentType={selectedDocument.entityType}
                  contentFormat={contentFormat}
                  onTitleChange={setTitle}
                  onContentChange={setContent}
                  onTogglePreview={togglePreviewMode}
                  onSave={saveDocument}
                  onVersionHistoryClick={handleVersionHistoryClick}
                  onDocumentTypeChange={updateDocumentType}
                  onContentFormatChange={updateContentFormat}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-semibold mb-2">No Document Selected</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Select a document from the sidebar or create a new one to get started.
                  </p>
                  <Button onClick={createNewDocument}>
                    <FilePlus className="h-4 w-4 mr-2" />
                    Create New Document
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Modals */}
        <VersionHistoryModal
          open={showVersionModal}
          onOpenChange={setShowVersionModal}
          versions={documentVersions}
          viewingIndex={viewingVersionIndex}
          onChangeIndex={setViewingVersionIndex}
          onActivateVersion={activateVersion}
        />
        
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          document={documentToDelete}
          onConfirm={deleteDocument}
        />
        
        <DiscardChangesDialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
          documentTitle={selectedDocument?.title || ''}
          onDiscard={handleDiscardChanges}
          onSaveAndSwitch={handleSaveAndSwitch}
        />
        
        {/* Project Edit Dialog - Desktop */}
        {projectToEdit && (
          <CreateProjectDialog
            open={showProjectDialog}
            onOpenChange={setShowProjectDialog}
            onCreateProject={handleSaveProjectEdit}
            mode="edit"
            initialTitle={projectToEdit.title}
            initialContent={projectToEdit.content}
          />
        )}
        
        {/* Project Delete Confirmation */}
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
                onClick={confirmDeleteProject}
              >
                Delete Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Mobile layout - add project selector here too
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 py-2 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDrawer}>
              <List className="h-5 w-5" />
            </Button>
          </div>
          <ProjectSelector
            key={projectSelectorKey}
            userId={user?.id}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateNewProject}
          />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={goToHome}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Mobile layout content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Document List Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setDrawerOpen(false)}
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-4/5 max-w-[280px] z-50 bg-background shadow-lg"
              >
                {/* Close button positioned outside the drawer */}
                <div className="absolute -right-10 top-3">
                  <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} className="bg-background/80 backdrop-blur-sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">{getHeaderTitle()}</h2>
                    <ProjectActionMenu />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <DocumentList
                      documents={filteredDocuments}
                      selectedDocument={selectedDocument}
                      searchQuery={searchQuery}
                      sortDirection={sortDirection}
                      onSearch={setSearchQuery}
                      onClearSearch={clearSearch}
                      onToggleSort={toggleSort}
                      onSelectDocument={(doc) => {
                        selectDocument(doc);
                        setDrawerOpen(false);
                      }}
                      onDuplicate={duplicateDocument}
                      onDelete={confirmDeleteDocument}
                      userId={user?.id}
                      onAssignToProject={setDocumentProject}
                      onCreateNew={createNewDocument}
                      currentProjectId={selectedProjectId}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Document content area */}
        <div className="flex-1 overflow-auto p-4">
          {loading && documents.length === 0 ? (
            <div className="flex items-center justify-center h-[60vh]">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="mx-auto max-w-md">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : selectedDocument ? (
            <DocumentEditor
              title={title}
              content={content}
              isPreviewMode={isPreviewMode}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              versionNumber={selectedDocument.versionNumber}
              hasUnsavedChanges={documentHasUnsavedChanges}
              documentType={selectedDocument.entityType}
              contentFormat={contentFormat}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onTogglePreview={togglePreviewMode}
              onSave={saveDocument}
              onVersionHistoryClick={handleVersionHistoryClick}
              onDocumentTypeChange={updateDocumentType}
              onContentFormatChange={updateContentFormat}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Document Selected</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {documents.length > 0 ? (
                  'Select a document from the menu or create a new one.'
                ) : (
                  'No documents found. Create your first document to get started.'
                )}
              </p>
              <div className="space-y-4">
                {documents.length > 0 && (
                  <Button onClick={toggleDrawer} variant="outline" className="mr-2">
                    <List className="h-4 w-4 mr-2" />
                    Show Documents
                  </Button>
                )}
                <Button onClick={createNewDocument}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  Create New Document
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <VersionHistoryModal
        open={showVersionModal}
        onOpenChange={setShowVersionModal}
        versions={documentVersions}
        viewingIndex={viewingVersionIndex}
        onChangeIndex={setViewingVersionIndex}
        onActivateVersion={activateVersion}
      />
      
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        document={documentToDelete}
        onConfirm={deleteDocument}
      />
      
      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        documentTitle={selectedDocument?.title || ''}
        onDiscard={handleDiscardChanges}
        onSaveAndSwitch={handleSaveAndSwitch}
      />
      
      {/* Project Edit Dialog */}
      {projectToEdit && (
        <CreateProjectDialog
          open={showProjectDialog}
          onOpenChange={setShowProjectDialog}
          onCreateProject={handleSaveProjectEdit}
          mode="edit"
          initialTitle={projectToEdit.title}
          initialContent={projectToEdit.content}
        />
      )}
      
      {/* Project Delete Confirmation */}
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
              onClick={confirmDeleteProject}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents; 