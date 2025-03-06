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
} from "lucide-react";
import { Document, SortDirection } from "../models/document";
import { countWords } from "@/utils/textUtils";

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
}: DocumentListProps) {
  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Documents</h2>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleSort}>
                {sortDirection === 'desc' ? (
                  <><SortDesc className="mr-2 h-4 w-4" /> Newest First</>
                ) : (
                  <><SortAsc className="mr-2 h-4 w-4" /> Oldest First</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearSearch}>
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
      
      <ScrollArea className="flex-grow">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? (
              <p>No documents match your search</p>
            ) : (
              <p>No documents found</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center rounded group relative ${
                  selectedDocument?.id === doc.id ? 'bg-muted' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <button
                  className="w-full text-left p-2 rounded min-h-[3rem]"
                  onClick={() => onSelectDocument(doc)}
                >
                  <div className="font-medium truncate">{doc.title}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {doc.updatedAt.toLocaleDateString()}
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs opacity-60"
                    >
                      {doc.content ? 
                        `${countWords(doc.content)} words` : 
                        'Empty'
                      }
                    </Badge>
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="secondary"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(doc);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-500" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(doc);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="mt-4 text-xs text-muted-foreground">
        {documents.length} {documents.length === 1 ? 'document' : 'documents'}
      </div>
    </div>
  );
} 