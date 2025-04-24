import React, { useState } from 'react';
import { ChatInterfaceRef } from '@/features/documents/components/ChatInterface.js';
import { LeanCanvasDisplay } from './LeanCanvasDisplay.js';
import { ChatInterface } from '@/features/documents/components/ChatInterface.js';
import { useDocumentsContext } from '@/features/documents/contexts/DocumentsContext.js';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.js';
import { PlusCircle, FileText, MessageSquareText } from 'lucide-react';

interface LeanCanvasMobileProps {
  jsonData: Record<string, string> | null;
  onDataChange: (updatedData: Record<string, string>) => Promise<void>;
  chatInterfaceRef?: React.RefObject<ChatInterfaceRef>;
}

export function LeanCanvasMobile({ 
  jsonData, 
  onDataChange,
  chatInterfaceRef
}: LeanCanvasMobileProps) {
  const { selectedDocument } = useDocumentsContext();
  const [activeTab, setActiveTab] = useState<'chat' | 'canvas'>('chat');
  
  // Handle tab switching
  const handleTabChange = (tab: 'chat' | 'canvas') => {
    setActiveTab(tab);
  };

  // Tab bar height that will be used for content padding and actual height
  const tabBarHeight = 64; // 16 in spacing units = 64px
  
  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Main content area - using flex-grow to fill available space */}
      <div className="flex-1 overflow-hidden relative">
        {/* Canvas View */}
        {activeTab === 'canvas' && (
          <div className="h-full overflow-auto">
            {selectedDocument ? (
              <div className="px-2 pt-4 pb-4">
                <LeanCanvasDisplay 
                  jsonData={jsonData} 
                  onDataChange={onDataChange} 
                  readOnly={false} 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 bg-gray-50 rounded-lg p-8 dark:bg-gray-900/50 m-4">
                <div className="text-xl text-center max-w-lg">
                  You don't have a Lean Canvas yet. Create one from the Documents page.
                </div>
                <Link to="/documents">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Go to Documents
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Chat View */}
        {activeTab === 'chat' && (
          <div className="h-full overflow-hidden">
            <ChatInterface 
              isStandalone={true}
              className="h-full"
              ref={chatInterfaceRef}
            />
          </div>
        )}
      </div>
      
      {/* Bottom tab bar - part of the flex layout */}
      <div 
        className="bg-background border-t border-border flex items-center justify-around shadow-lg z-50"
        style={{ height: `${tabBarHeight}px` }}
      >
        {/* Chat Tab */}
        <button 
          onClick={() => handleTabChange('chat')}
          className={`flex flex-col items-center justify-center w-1/2 h-full transition-colors
            ${activeTab === 'chat' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <MessageSquareText className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Chat</span>
        </button>
        
        {/* Canvas Tab */}
        <button 
          onClick={() => handleTabChange('canvas')}
          className={`flex flex-col items-center justify-center w-1/2 h-full transition-colors
            ${activeTab === 'canvas' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <FileText className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Canvas</span>
        </button>
      </div>
    </div>
  );
}