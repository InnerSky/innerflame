import React from "react";
import { Button } from "@/components/ui/button.js";
import { ArrowUp } from "lucide-react";
import { useChatState } from "@/features/chat/contexts/ChatStateContext.js";

export const CaptureHome: React.FC = () => {
  const { openChat } = useChatState();

  const handleOpenCapture = () => {
    openChat("capture");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 pb-0">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Capture Your Thoughts</h1>
        
        <p className="text-muted-foreground mb-8 text-center">
          Jot down your ideas, thoughts, and observations to reflect on later.
        </p>
        
        {/* Message Input Field */}
        <div 
          onClick={handleOpenCapture}
          className="flex items-center w-full border rounded-full bg-background px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 cursor-pointer mb-4"
        >
          <div className="flex-1 text-muted-foreground text-sm">Capture a thought...</div>
          <button 
            className="flex justify-center items-center h-8 w-8 min-h-[32px] min-w-[32px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        
        <Button 
          onClick={handleOpenCapture}
          className="w-full"
        >
          Start Capture Session
        </Button>
      </div>
    </div>
  );
};

export default CaptureHome; 