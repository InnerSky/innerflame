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
  FilePlus
} from "lucide-react";
import { Document, SortDirection } from "../models/document";
import { countWords } from "@/utils/textUtils";
import { useState, useEffect } from "react";
import { DocumentRepository } from "../repositories/documentRepository";

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
  currentProjectId
}: DocumentListProps) {
  const [projects, setProjects] = useState<Document[]>([]);

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

  return (
    <div className="h-full flex flex-col overflow-hidden px-3 sm:px-0 pt-2">
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
          className="w-full mb-4 flex items-center justify-center"
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
                    group flex justify-between items-start px-3 py-2 rounded-md
                    ${selectedDocument?.id === document.id 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-muted/50 dark:hover:bg-muted/20'
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
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
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