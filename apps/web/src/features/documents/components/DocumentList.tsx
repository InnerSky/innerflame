import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  X,
  Filter,
  SortDesc,
  SortAsc,
  Copy,
  Trash2,
  MoreHorizontal,
  Folder,
  FolderOpen,
  FilePlus,
  ChevronRight
} from "lucide-react";
import { Document, SortDirection } from "../models/document";
import { countWords } from "@/utils/textUtils";
import { useState, useEffect } from "react";
import { DocumentRepository } from "../repositories/documentRepository";
import { useDocumentsContext } from "../contexts/DocumentsContext.js";

interface DocumentListProps {
  documents: Document[];
  selectedDocument: Document | null;
  searchQuery: string;
  sortDirection: SortDirection;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onToggleSort: () => void;
  onSelectDocument: (document: Document) => void;
  onDuplicate: (document: Document) => void;
  onDelete: (document: Document) => void;
  userId?: string;
  onAssignToProject?: (documentId: string, projectId: string | null) => void;
  onCreateNew?: () => void;
  currentProjectId?: string | null;
  getHeaderTitle?: () => string;
  onDrawerClose?: () => void;
}

export function DocumentList({
  documents,
  selectedDocument,
  searchQuery,
  sortDirection,
  onSearch,
  onClearSearch,
  onToggleSort,
  onSelectDocument,
  onDuplicate,
  onDelete,
  userId,
  onAssignToProject,
  onCreateNew,
  currentProjectId,
  getHeaderTitle = () => "Documents",
  onDrawerClose
}: DocumentListProps) {
  const [projects, setProjects] = useState<Document[]>([]);
  const { selectProject } = useDocumentsContext();

  // Load available projects when component mounts
  useEffect(() => {
    const loadProjects = async () => {
      if (!userId) return;
      
      try {
        const repository = new DocumentRepository();
        const userProjects = await repository.getUserProjectsOnly(userId);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    
    loadProjects();
  }, [userId]);

  // Get the project name for a document
  const getProjectName = (document: Document) => {
    if (!document.metadata?.projectId) return null;
    
    const project = projects.find(p => p.id === document.metadata?.projectId);
    return project ? project.title : 'Unknown Project';
  };

  // Project context selection handler
  const handleProjectContextSelect = () => {
    if (currentProjectId && selectedDocument) {
      // Reselect the current project - this triggers useDocuments.selectProject
      // which will clear selectedDocument
      selectProject(currentProjectId);
      
      // Close the mobile drawer if handler is provided
      if (onDrawerClose) {
        onDrawerClose();
      }
    }
  };

  // Only show project selection button if we're in a project
  const isInProject = !!currentProjectId;
  const isInProjectWithDocument = isInProject && !!selectedDocument;

  return (
    <div className="h-full flex flex-col overflow-hidden px-3 sm:px-0 pt-2">
      {isInProject && (
        <div className="flex-shrink-0 mb-4">
          {/* Project header with clickable title */}
          <button
            onClick={handleProjectContextSelect}
            className={`w-full text-left px-4 py-3 rounded-md transition-all duration-200 border-l-2 ${
              isInProjectWithDocument
                ? "hover:bg-muted border-transparent hover:border-muted-foreground/30"
                : "bg-accent text-accent-foreground border-primary"
            }`}
            disabled={!isInProject || !isInProjectWithDocument}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                {isInProjectWithDocument ? (
                  <FolderOpen className="h-5 w-5 text-foreground transition-transform duration-200" />
                ) : (
                  <Folder className="h-5 w-5 text-accent-foreground transition-transform duration-200" />
                )}
                <span className={`text-lg ${!isInProjectWithDocument ? "font-semibold" : "font-medium"}`}>{getHeaderTitle()}</span>
              </div>
              {isInProjectWithDocument && (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground opacity-70" />
              )}
            </div>
            {isInProjectWithDocument && (
              <div className="text-xs mt-1.5 text-muted-foreground group-hover:text-foreground">
                Click to view project overview
              </div>
            )}
          </button>
          {isInProjectWithDocument && (
            <div className="px-2 my-3">
              <Separator className="bg-muted-foreground/20" />
            </div>
          )}
        </div>
      )}

      <div className="relative mb-2 flex-shrink-0 p-0.5">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          className="pl-8 pr-8"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="absolute right-2 top-2.5"
            onClick={onClearSearch}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      {onCreateNew && (
        <Button 
          onClick={onCreateNew} 
          size="sm" 
          variant="outline" 
          className="w-full mb-4 flex items-center justify-center border-l-2 border-transparent hover:border-primary/50 transition-colors"
        >
          <FilePlus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      )}
      
      <ScrollArea className="flex-1 pr-3 sm:pr-4 pl-1 overflow-auto h-full">
        <div className="space-y-1">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No documents found.</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try a different search term.</p>
              )}
            </div>
          ) : (
            documents.map((document) => {
              const projectName = getProjectName(document);
              
              return (
                <div
                  key={document.id}
                  className={`
                    group flex justify-between items-start px-3 py-2 rounded-md transition-all duration-200 border-l-2
                    ${selectedDocument?.id === document.id 
                      ? 'bg-accent text-accent-foreground border-primary' 
                      : 'hover:bg-muted border-transparent hover:border-muted-foreground/30'
                    }
                  `}
                  onClick={() => onSelectDocument(document)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{document.title || 'Untitled Document'}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {new Date(document.updatedAt).toLocaleDateString()} • {countWords(document.content)} words
                    </div>
                    {projectName && currentProjectId === null && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs flex items-center gap-1 truncate max-w-[180px]">
                          <Folder className="h-3 w-3" />
                          <span>{projectName}</span>
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(document);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      
                      {onAssignToProject && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Folder className="mr-2 h-4 w-4" />
                            Assign to Project
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAssignToProject(document.id, null);
                                }}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Default Project
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {projects.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  No projects available
                                </div>
                              ) : (
                                projects.map((project) => (
                                  <DropdownMenuItem
                                    key={project.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAssignToProject(document.id, project.id);
                                    }}
                                  >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    {project.title}
                                  </DropdownMenuItem>
                                ))
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(document);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 