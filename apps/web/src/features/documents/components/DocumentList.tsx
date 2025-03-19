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
  ChevronRight,
  ChevronDown
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
    <div className="h-full flex flex-col overflow-hidden px-1.5 sm:px-2 pt-2 sm:pt-3 max-w-full">
      {isInProject && (
        <div className="flex-shrink-0 mb-3 sm:mb-4 mx-0.5">
          {/* Project header with clickable title */}
          <button
            onClick={handleProjectContextSelect}
            className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-r-md rounded-l-none transition-all duration-300 border-l-2 focus:outline-none focus:ring-1 focus:ring-primary/30 group ${
              isInProjectWithDocument
                ? "hover:bg-muted/60 border-transparent hover:border-muted-foreground/30 hover:translate-x-0.5"
                : "bg-accent/90 text-accent-foreground border-primary shadow-sm hover:bg-accent/95"
            }`}
            disabled={!isInProject || !isInProjectWithDocument}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {isInProjectWithDocument ? (
                  <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-foreground transition-all duration-200 group-hover:scale-110" />
                ) : (
                  <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground transition-all duration-200 group-hover:text-accent-foreground/80" />
                )}
                <span className={`text-base sm:text-lg ${!isInProjectWithDocument ? "font-semibold" : "font-medium"}`}>{getHeaderTitle()}</span>
              </div>
              {isInProjectWithDocument ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground opacity-70 transition-all duration-200 group-hover:scale-110" />
              ) : (
                <ChevronRight className="h-4 w-4 text-accent-foreground opacity-80 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
              )}
            </div>
          </button>
        </div>
      )}

      <div className="relative mb-3 flex-shrink-0 mx-0.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          className="pl-8 sm:pl-9 pr-8 h-8 sm:h-10 text-sm sm:text-base focus-visible:ring-1 focus-visible:ring-primary/30 border-muted"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            <X className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      <ScrollArea className="flex-1 pr-1.5 sm:pr-3 pl-0.5 overflow-auto h-full pb-1 -mx-0.5">
        <div className="space-y-1.5 sm:space-y-2 mx-0.5">
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
                    group flex justify-between items-start px-3 py-2.5 rounded-r-md rounded-l-none transition-all duration-300 border-l-2 focus:outline-none focus-within:ring-1 focus-within:ring-primary/30
                    ${selectedDocument?.id === document.id 
                      ? 'bg-accent/90 text-accent-foreground border-primary shadow-sm' 
                      : 'hover:bg-muted/60 border-transparent hover:border-muted-foreground/30 hover:translate-x-0.5'
                    }
                  `}
                  onClick={() => onSelectDocument(document)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium truncate leading-tight">{document.title || 'Untitled Document'}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <span className="inline-block">{new Date(document.updatedAt).toLocaleDateString()}</span>
                      <span className="mx-1.5">•</span>
                      <span className="inline-block">{countWords(document.content)} words</span>
                    </div>
                    {projectName && currentProjectId === null && (
                      <div className="mt-1.5">
                        <Badge variant="outline" className="text-xs flex items-center gap-1 truncate max-w-[180px] bg-background/70">
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
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background/80 focus:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="More options"
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
      
      {onCreateNew && (
        <div className="mt-auto sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur-[2px] z-10">
          <div className="px-1 py-1 sm:py-1.5">
            <div
              onClick={onCreateNew}
              className="group flex items-center px-3 py-2 sm:py-2.5 rounded-r-md rounded-l-none cursor-pointer border-l-2 border-transparent hover:bg-muted/60 hover:border-muted-foreground/30 hover:translate-x-0.5 transition-all duration-300"
              tabIndex={0}
              role="button"
              aria-label="Create new document"
            >
              <FilePlus className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-2 text-muted-foreground" />
              <span className="font-medium text-sm sm:text-base">New document</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 