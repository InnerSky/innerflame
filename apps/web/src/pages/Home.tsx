import React, { useState, useEffect } from "react";
import { 
  CaptureHome, 
  CoachHome, 
  StudioHome
} from "@/features/home/index.js";
import { QuoteIcon, MessageSquare, Pen, Menu, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { ChatStateProvider, ChatOverlay } from "@/features/chat/index.js";
import Settings from "@/pages/Settings.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.js";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"capture" | "coach" | "studio">("coach");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Add effect to set CSS variable for viewport height
  useEffect(() => {
    // Set CSS variable for viewport height to handle mobile browsers
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);

  // Check if we're on mobile based on screen width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Store in localStorage for persistence and for other components to read
    localStorage.setItem('sidebar-expanded', newExpandedState.toString());
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('sidebar-changed'));
  };
  
  // Initialize from localStorage on load
  useEffect(() => {
    const storedState = localStorage.getItem('sidebar-expanded');
    if (storedState !== null) {
      setIsExpanded(storedState === 'true');
    }
  }, []);

  return (
    <ChatStateProvider>
      <div className="flex h-screen h-[calc(100vh-env(safe-area-inset-bottom))] w-full" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className={cn(
            "h-full border-r bg-background transition-all duration-300 ease-in-out flex flex-col z-30",
            isExpanded ? "w-64" : "w-16"
          )}>
            {/* Sidebar Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="self-start m-3" 
              onClick={toggleSidebar}
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Sidebar Navigation Items */}
            <div className="flex flex-col space-y-2 mt-6 px-2">
              <SidebarItem 
                isActive={activeTab === "capture"}
                onClick={() => setActiveTab("capture")}
                icon={<QuoteIcon className="h-5 w-5" />}
                label="Capture"
                isExpanded={isExpanded}
              />
              <SidebarItem 
                isActive={activeTab === "coach"}
                onClick={() => setActiveTab("coach")}
                icon={<MessageSquare className="h-5 w-5" />}
                label="Reflect"
                isExpanded={isExpanded}
              />
            </div>
            
            {/* Settings Button at bottom of sidebar */}
            <div className="mt-auto mb-6 px-2">
              <SidebarItem 
                isActive={false}
                onClick={() => setShowSettings(true)}
                icon={<SettingsIcon className="h-5 w-5" />}
                label="Settings"
                isExpanded={isExpanded}
              />
            </div>
          </aside>
        )}
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 overflow-auto pb-16 md:pb-0">
            {activeTab === "capture" && <CaptureHome />}
            {activeTab === "coach" && <CoachHome />}
            {activeTab === "studio" && <StudioHome />}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-20">
            <div className="grid grid-cols-3 h-16">
              <button
                onClick={() => setActiveTab("capture")}
                className={cn("flex flex-col items-center justify-center",
                  activeTab === "capture" ? "text-primary" : "text-muted-foreground hover:text-primary/80"
                )}
              >
                <QuoteIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Capture</span>
              </button>
              
              <button
                onClick={() => setActiveTab("coach")}
                className={cn("flex flex-col items-center justify-center",
                  activeTab === "coach" ? "text-primary" : "text-muted-foreground hover:text-primary/80"
                )}
              >
                <MessageSquare className="h-5 w-5 mb-1" />
                <span className="text-xs">Reflect</span>
              </button>
              
              {/* Settings button in mobile nav */}
              <button
                onClick={() => setShowSettings(true)}
                className={cn("flex flex-col items-center justify-center",
                  "text-muted-foreground hover:text-primary/80"
                )}
              >
                <SettingsIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Chat Overlay */}
        <ChatOverlay />
        
        {/* Settings Modal */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="w-full h-full max-w-full p-0 flex flex-col items-start justify-start sm:max-w-[min(calc(100%-100px),750px)] sm:rounded-lg sm:h-auto sm:max-h-[calc(100vh-100px)] overflow-hidden">
            <div className="overflow-y-auto w-full h-full flex-1">
              <div className="h-full">
                <Settings />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ChatStateProvider>
  );
}

interface SidebarItemProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  isActive,
  onClick,
  icon,
  label,
  isExpanded
}) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "flex justify-start items-center h-12 w-full transition-all",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary/80",
        isExpanded ? "px-3" : "pl-3 pr-0"
      )}
    >
      <div className="flex items-center min-w-[24px]">
        <span>{icon}</span>
      </div>
      {isExpanded && <span className="ml-3">{label}</span>}
    </Button>
  );
};