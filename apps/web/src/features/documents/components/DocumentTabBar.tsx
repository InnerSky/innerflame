import React from 'react';
import { Button } from '@/components/ui/button.js';
import { FileText, MessageSquare, Folder } from 'lucide-react';

export type DocumentTabView = 'document' | 'chat';

type DocumentTabBarProps = {
  activeView: DocumentTabView;
  onChangeView: (view: DocumentTabView) => void;
  isProjectMode?: boolean;
};

export const DocumentTabBar: React.FC<DocumentTabBarProps> = ({ 
  activeView, 
  onChangeView,
  isProjectMode = false
}) => {
  return (
    <div className="flex w-full border-b bg-background">
      <Button
        variant="ghost"
        className={`flex-1 rounded-none flex items-center justify-center gap-2 py-3 ${
          activeView === 'document' ? 'border-b-2 border-primary' : ''
        }`}
        onClick={() => onChangeView('document')}
      >
        {isProjectMode ? (
          <Folder className="w-4 h-4" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>{isProjectMode ? 'Project' : 'Document'}</span>
      </Button>
      
      <Button
        variant="ghost"
        className={`flex-1 rounded-none flex items-center justify-center gap-2 py-3 ${
          activeView === 'chat' ? 'border-b-2 border-primary' : ''
        }`}
        onClick={() => onChangeView('chat')}
      >
        <MessageSquare className="w-4 h-4" />
        <span>Chat</span>
      </Button>
    </div>
  );
}; 