import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button.js";

export const CoachPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleEndConversation = () => {
    // Logic to end the conversation
    // For now, just navigate back to home
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Top Navigation Bar */}
      <header className="w-full border-b bg-background">
        <div className="flex items-center justify-between h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-medium">Coach</h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndConversation}
            aria-label="End conversation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-muted-foreground">Coaching session content will go here</p>
        </div>
      </main>
    </div>
  );
};

export default CoachPage; 