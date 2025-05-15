import React from "react";
import { Button } from "@/components/ui/button.js";
import { Card } from "@/components/ui/card.js";
import { PenLine, Lightbulb, Sparkles } from "lucide-react";
import { useChatState } from "@/features/chat/contexts/ChatStateContext.js";

export const StudioHome: React.FC = () => {
  const { openChat } = useChatState();

  const handleOpenStudio = () => {
    openChat("studio");
  };

  const handleStartWriting = () => {
    openChat("studio");
  };

  const handleGenerateIdeas = () => {
    openChat("studio");
  };

  return (
    <div className="flex flex-col items-center w-full p-4 pb-0">
      <div className="max-w-3xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Create with AI</h1>
        
        <p className="text-muted-foreground mb-8 text-center md:text-left">
          Use AI to help you write, brainstorm, and create content.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={handleStartWriting}
          >
            <div className="flex flex-col items-center md:items-start">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start Writing</h3>
              <p className="text-sm text-muted-foreground text-center md:text-left">
                Begin a new document with AI assistance to help you write faster.
              </p>
            </div>
          </Card>
          
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={handleGenerateIdeas}
          >
            <div className="flex flex-col items-center md:items-start">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Generate Ideas</h3>
              <p className="text-sm text-muted-foreground text-center md:text-left">
                Brainstorm new concepts and get creative inspiration for your work.
              </p>
            </div>
          </Card>
        </div>
        
        <Button 
          onClick={handleOpenStudio}
          className="w-full mb-4"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Open Studio
        </Button>
      </div>
    </div>
  );
};

export default StudioHome; 