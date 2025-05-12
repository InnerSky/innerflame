import React, { useState } from "react";
import { 
  CaptureHome, 
  CoachHome, 
  StudioHome, 
  HomeNavigation 
} from "@/features/home/index.js";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"capture" | "coach" | "studio">("capture");

  return (
    <div className="flex flex-col h-screen w-full">
      <HomeNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        {activeTab === "capture" && <CaptureHome />}
        {activeTab === "coach" && <CoachHome />}
        {activeTab === "studio" && <StudioHome />}
                    </div>
                  </div>
  );
}