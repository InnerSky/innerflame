import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { MarkdownRenderer } from '@/components/markdown-renderer.js';
import { Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.js';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { Document } from '../models/document.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { ScrollArea } from '@/components/ui/scroll-area.js';

type ProjectInfoProps = {
  onCreateNew: () => void;
  projectActionMenu?: React.ReactNode;
  className?: string;
};

// Define the ref type for refreshing project details
export interface ProjectInfoRefType {
  refreshProjectDetails: () => Promise<void>;
}

export const ProjectInfo = forwardRef<ProjectInfoRefType, ProjectInfoProps>(({
  onCreateNew,
  projectActionMenu,
  className = ''
}, ref) => {
  const { selectedProjectId, projectsData } = useDocumentsContext();
  const [projectDetails, setProjectDetails] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  // Function to fetch the project details
  const fetchProjectDetails = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    try {
      const repository = new DocumentRepository();
      const details = await repository.getDocumentWithVersions(selectedProjectId);
      setProjectDetails(details);
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose the refresh function to parent components through ref
  useImperativeHandle(ref, () => ({
    refreshProjectDetails: async () => {
      await fetchProjectDetails();
      return;
    }
  }));

  // Fetch the project details when selectedProjectId changes or project data updates
  useEffect(() => {
    fetchProjectDetails();
  }, [selectedProjectId, selectedProjectId ? projectsData[selectedProjectId] : null]);

  // If no project is selected, this component shouldn't be shown
  if (!selectedProjectId) {
    return null;
  }

  // Get the project name from the context
  const projectName = projectsData[selectedProjectId] || 'Loading Project...';
  
  // Format the dates for display
  const formattedCreatedAt = projectDetails?.createdAt 
    ? new Date(projectDetails.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : null;
    
  const formattedUpdatedAt = projectDetails?.updatedAt 
    ? new Date(projectDetails.updatedAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : null;

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Folder className="h-5 w-5 text-foreground" />
            <span>{projectName}</span>
          </CardTitle>
          {projectActionMenu}
        </div>
        {formattedUpdatedAt && (
          <div className="text-xs text-muted-foreground">
            Last updated: {formattedUpdatedAt}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden pb-0 flex flex-col">
        {/* Project content with loading state */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none mb-6">
              {projectDetails?.content ? (
                <MarkdownRenderer content={projectDetails.content} />
              ) : (
                <p className="text-muted-foreground italic">No description provided for this project.</p>
              )}
            </div>
          )}
        </ScrollArea>
        
        {/* Fixed action buttons at the bottom */}
        <div className="mt-4 py-4 border-t">
          <div className="flex justify-center">
            <Button 
              onClick={onCreateNew} 
              className="flex items-center justify-center px-8"
              size="default"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
          
          {projectDetails?.createdAt && (
            <div className="text-xs text-muted-foreground text-center mt-4">
              Project created on {formattedCreatedAt}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}); 