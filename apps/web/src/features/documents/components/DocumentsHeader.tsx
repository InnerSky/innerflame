import React from 'react';
import { Button } from '@/components/ui/button.js';
import { ThemeToggle } from '@/components/ThemeToggle.js';
import { ProjectSelector } from './ProjectSelector.js';
import { Home, List } from 'lucide-react';
import { useDocumentsContext } from '../contexts/DocumentsContext.js';

type DocumentsHeaderProps = {
  projectSelectorKey: number;
  userId: string | undefined;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (title: string, content: string) => Promise<any>;
  onToggleDrawer?: () => void; // Optional for mobile
  onGoHome: () => void;
  isMobile?: boolean;
};

export const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({
  projectSelectorKey,
  userId,
  onSelectProject,
  onCreateProject,
  onToggleDrawer,
  onGoHome,
  isMobile = false
}) => {
  return (
    <header className={`${isMobile ? 'px-4 py-2 border-b' : 'px-4 md:px-6 mb-6'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onToggleDrawer}>
              <List className="h-5 w-5" />
            </Button>
          )}
          
          {!isMobile && (
            <ProjectSelector 
              key={projectSelectorKey}
              userId={userId}
              selectedProjectId={useDocumentsContext().selectedProjectId}
              onSelectProject={onSelectProject}
              onCreateProject={onCreateProject}
            />
          )}
        </div>
        
        {isMobile && (
          <ProjectSelector
            key={projectSelectorKey}
            userId={userId}
            selectedProjectId={useDocumentsContext().selectedProjectId}
            onSelectProject={onSelectProject}
            onCreateProject={onCreateProject}
          />
        )}
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant={isMobile ? "ghost" : "outline"} 
            size={isMobile ? "sm" : "sm"} 
            onClick={onGoHome}
          >
            <Home className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Home</span>}
          </Button>
        </div>
      </div>
    </header>
  );
}; 