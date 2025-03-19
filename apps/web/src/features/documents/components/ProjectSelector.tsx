import React, { useEffect, useState } from 'react';
import { Document, DocumentType } from '../models/document';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DocumentRepository } from '../repositories/documentRepository';
import { CreateProjectDialog } from './CreateProjectDialog';

interface ProjectSelectorProps {
  userId?: string;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject?: (title: string, content: string) => void;
}

export function ProjectSelector({ 
  userId, 
  selectedProjectId, 
  onSelectProject,
  onCreateProject 
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Special values for Project options
  const ALL_PROJECTS_VALUE = "all_projects";
  
  useEffect(() => {
    // Load all projects for the user
    const loadProjects = async () => {
      if (!userId) {
        // Still set loading to false even if no userId
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const repository = new DocumentRepository();
        const userProjects = await repository.getUserProjectsOnly(userId);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, [userId, selectedProjectId]);
  
  // Helper to convert between special values and actual IDs
  const getSelectValue = () => {
    if (selectedProjectId === null) return ALL_PROJECTS_VALUE;
    return selectedProjectId;
  };
  
  const handleValueChange = (value: string) => {
    if (value === ALL_PROJECTS_VALUE) {
      onSelectProject(null);
    } else {
      onSelectProject(value);
    }
  };

  const handleCreateButtonClick = () => {
    setShowCreateDialog(true);
  };

  const handleCreateProject = async (title: string, content: string) => {
    if (onCreateProject) {
      // Call the updated createNewProject with title and content
      await onCreateProject(title, content);
      
      // Reload projects after creating a new one
      if (userId) {
        const repository = new DocumentRepository();
        const userProjects = await repository.getUserProjectsOnly(userId);
        setProjects(userProjects);
      }
    }
  };
  
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {loading ? (
            <div className="flex h-11 md:h-9 w-[200px] items-center whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-sm text-muted-foreground">
              Loading projects...
            </div>
          ) : (
            <Select
              value={getSelectValue()}
              onValueChange={handleValueChange}
              disabled={loading || !userId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PROJECTS_VALUE}>All Documents</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {onCreateProject && userId && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCreateButtonClick}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        )}
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateProject={handleCreateProject}
        mode="create"
      />
    </>
  );
} 