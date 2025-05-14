import React from "react";
import { QuoteIcon, MessageSquare, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";

type NavigationTab = "capture" | "coach" | "studio";

interface HomeNavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export const HomeNavigation: React.FC<HomeNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <>
      {/* Desktop Navigation (Top) */}
      <div className="hidden md:block w-full border-b">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-center space-x-8">
            <TabButton 
              isActive={activeTab === "capture"}
              onClick={() => setActiveTab("capture")}
              icon={<QuoteIcon className="h-5 w-5 mr-2" />}
              label="Capture"
            />
            <TabButton 
              isActive={activeTab === "coach"}
              onClick={() => setActiveTab("coach")}
              icon={<MessageSquare className="h-5 w-5 mr-2" />}
              label="Reflect"
            />
            <TabButton 
              isActive={activeTab === "studio"}
              onClick={() => setActiveTab("studio")}
              icon={<FileEdit className="h-5 w-5 mr-2" />}
              label="Studio"
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="grid grid-cols-3 h-16">
          <TabButton 
            isActive={activeTab === "capture"}
            onClick={() => setActiveTab("capture")}
            icon={<QuoteIcon className="h-5 w-5 mb-1" />}
            label="Capture"
            isMobile
          />
          <TabButton 
            isActive={activeTab === "coach"}
            onClick={() => setActiveTab("coach")}
            icon={<MessageSquare className="h-5 w-5 mb-1" />}
            label="Reflect"
            isMobile
          />
          <TabButton 
            isActive={activeTab === "studio"}
            onClick={() => setActiveTab("studio")}
            icon={<FileEdit className="h-5 w-5 mb-1" />}
            label="Studio"
            isMobile
          />
        </div>
      </div>
    </>
  );
};

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isMobile?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  isActive,
  onClick,
  icon,
  label,
  isMobile = false,
}) => {
  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center ${
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-primary/80"
        }`}
      >
        {icon}
        <span className="text-xs">{label}</span>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`flex items-center py-4 border-b-2 rounded-none ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-primary/80"
      }`}
    >
      {icon}
      {label}
    </Button>
  );
};

export default HomeNavigation; 