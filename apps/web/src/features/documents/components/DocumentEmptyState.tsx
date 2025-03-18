import React from 'react';
import { FileText, FilePlus, List } from 'lucide-react';
import { Button } from '@/components/ui/button.js';

type DocumentEmptyStateProps = {
  isMobile?: boolean;
  documentsExist: boolean;
  onCreateNew: () => void;
  onShowDocuments?: () => void; // For mobile only
};

export const DocumentEmptyState: React.FC<DocumentEmptyStateProps> = ({
  isMobile = false,
  documentsExist,
  onCreateNew,
  onShowDocuments
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
      <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold mb-2`}>
        No Document Selected
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {documentsExist
          ? 'Select a document from the sidebar or create a new one to get started.'
          : 'No documents found. Create your first document to get started.'}
      </p>
      
      <div className={isMobile ? "space-y-4" : undefined}>
        {isMobile && documentsExist && onShowDocuments && (
          <Button onClick={onShowDocuments} variant="outline" className="mr-2">
            <List className="h-4 w-4 mr-2" />
            Show Documents
          </Button>
        )}
        
        <Button onClick={onCreateNew}>
          <FilePlus className="h-4 w-4 mr-2" />
          Create New Document
        </Button>
      </div>
    </div>
  );
}; 