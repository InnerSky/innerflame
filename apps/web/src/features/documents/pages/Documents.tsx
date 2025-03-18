import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments.js';
import { DocumentsProvider } from '../contexts/DocumentsContext.js';
import { DocumentsResponsiveLayout } from '../layouts/DocumentsResponsiveLayout.js';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { Document } from '../models/document.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { ProjectInfoRefType } from '../components/ProjectInfo.js';

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);
  
  // Open drawer (mobile)
  const openDrawer = useCallback(() => {
      setDrawerOpen(true);
  }, []);
  
  // Wrapper for project selection that also opens the drawer
  const handleSelectProject = useCallback((projectId: string | null) => {
    selectProject(projectId);
    // Open the drawer to show documents in the selected project
    openDrawer();
  }, [selectProject, openDrawer]);
  
  // Go to home
  const goToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);
  
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
  
  // Store the refresh function instead of the ref
  const refreshProjectInfo = useRef<(() => Promise<void>) | null>(null);

  // Function to handle receiving the ProjectInfo ref from DocumentWorkspace
  const handleProjectInfoRefCreated = useCallback((ref: React.RefObject<ProjectInfoRefType>) => {
    if (ref.current) {
      refreshProjectInfo.current = ref.current.refreshProjectDetails;
    }
  }, []);
  
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
      
      // Refresh the ProjectInfo component if the function is available
      if (refreshProjectInfo.current) {
        // Add a small delay to ensure the state updates have propagated
        setTimeout(async () => {
          if (refreshProjectInfo.current) {
            await refreshProjectInfo.current();
          }
        }, 100);
      }
      
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
  
  // Add a wrapper function for fetchDocumentVersions
  const handleVersionHistoryClick = useCallback(() => {
    if (selectedDocument?.id) {
      fetchDocumentVersions(selectedDocument.id);
      setShowVersionModal(true);
    }
  }, [selectedDocument, fetchDocumentVersions, setShowVersionModal]);
  
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
      <div className="flex items-center ml-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 focus-visible:ring-1 focus-visible:ring-ring"
            >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleEditProject}>
              <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteProject}
              className="text-destructive"
            >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
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
  
  // Create a wrapper function for duplicateDocument to match the Document parameter type
  const handleDuplicateDocument = useCallback(async (document: Document) => {
    return duplicateDocument(document);
  }, [duplicateDocument]);
  
  // Construct the context value for the DocumentsContext
  const documentsContextValue = useMemo(() => ({
    // Document state
    selectedDocument,
    title,
    content,
    isPreviewMode,
    saveStatus,
    lastSaved,
    hasUnsavedChanges: documentHasUnsavedChanges,
    contentFormat,
    documentVersions,
    
    // Project state
    selectedProjectId,
    projectsData,
    
    // Operations
    saveDocument,
    selectDocument,
    selectProject,
    setTitle,
    setContent,
    togglePreviewMode: togglePreviewMode,
    updateDocumentType,
    updateContentFormat,
    fetchDocumentVersions,
    handleVersionHistoryClick,
  }), [
    selectedDocument, title, content, isPreviewMode, saveStatus, lastSaved,
    documentHasUnsavedChanges, contentFormat, documentVersions, selectedProjectId,
    projectsData, saveDocument, selectDocument, selectProject, setTitle,
    setContent, togglePreviewMode, updateDocumentType, updateContentFormat,
    fetchDocumentVersions, handleVersionHistoryClick
  ]);
  
  return (
    <DocumentsProvider value={documentsContextValue}>
      <DocumentsResponsiveLayout
        // User information
        userId={user?.id}
        
        // Drawer state
        drawerOpen={drawerOpen}
        toggleDrawer={toggleDrawer}
        
        // Project handling
        projectSelectorKey={projectSelectorKey}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateNewProject}
        onGoHome={goToHome}
        projectActionMenu={<ProjectActionMenu />}
        getHeaderTitle={getHeaderTitle}
        onProjectInfoRefCreated={handleProjectInfoRefCreated}
        
        // Document list props
        filteredDocuments={filteredDocuments}
                      searchQuery={searchQuery}
                      sortDirection={sortDirection}
                      onSearch={setSearchQuery}
                      onClearSearch={clearSearch}
                      onToggleSort={toggleSort}
        onDuplicate={handleDuplicateDocument}
        onConfirmDeleteDocument={confirmDeleteDocument}
                      onAssignToProject={setDocumentProject}
                      onCreateNew={createNewDocument}
        
        // Loading states
        loading={loading}
        error={error}
        
        // Modal handling
        showVersionModal={showVersionModal}
        setShowVersionModal={setShowVersionModal}
        viewingVersionIndex={viewingVersionIndex}
        setViewingVersionIndex={setViewingVersionIndex}
        onActivateVersion={activateVersion}
        
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        documentToDelete={documentToDelete}
        onDeleteDocument={deleteDocument}
        
        showDiscardDialog={showDiscardDialog}
        setShowDiscardDialog={setShowDiscardDialog}
        onDiscardChanges={handleDiscardChanges}
        onSaveAndSwitch={handleSaveAndSwitch}
        
        showProjectDialog={showProjectDialog}
        setShowProjectDialog={setShowProjectDialog}
        projectToEdit={projectToEdit}
        onSaveProjectEdit={handleSaveProjectEdit}
        
        showDeleteProjectDialog={showDeleteProjectDialog}
        setShowDeleteProjectDialog={setShowDeleteProjectDialog}
        onDeleteProject={confirmDeleteProject}
      />
    </DocumentsProvider>
  );
};

export default Documents; 