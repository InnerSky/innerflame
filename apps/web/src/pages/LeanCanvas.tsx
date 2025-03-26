import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.js';
import { Document } from '@/features/documents/models/document.js';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Laptop } from 'lucide-react';
import { LeanCanvasDesktop, LeanCanvasProvider } from '@/features/documents/components/lean-canvas/index.js';
import leanCanvasService from '@/features/documents/services/leanCanvasService.js';

export default function LeanCanvas() {
  const { user } = useAuth();
  const [leanCanvas, setLeanCanvas] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<Record<string, string> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function fetchLeanCanvas() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use the service to get the most recent lean canvas
        const mostRecentLeanCanvas = await leanCanvasService.getMostRecentLeanCanvas(user.id);
        
        if (mostRecentLeanCanvas) {
          setLeanCanvas(mostRecentLeanCanvas);
          
          // Parse the JSON content
          try {
            const parsedContent = mostRecentLeanCanvas.content ? 
              JSON.parse(mostRecentLeanCanvas.content) : null;
            setJsonData(parsedContent);
          } catch (parseError) {
            console.error('Error parsing lean canvas content:', parseError);
            setError('Could not parse the lean canvas data.');
          }
        } else {
          // No lean canvas found
          setLeanCanvas(null);
          setJsonData(null);
        }
      } catch (fetchError) {
        console.error('Error fetching lean canvas:', fetchError);
        setError('Failed to load your lean canvas. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchLeanCanvas();
  }, [user?.id]);

  // Handle data changes if they need to be saved
  const handleDataChange = async (updatedData: Record<string, string>) => {
    if (!leanCanvas || !user?.id) return;
    
    try {
      // Use the service's saveLeanCanvas method
      await leanCanvasService.saveLeanCanvas(
        leanCanvas.id, 
        leanCanvas.title, 
        updatedData
      );
      
      // Update local state
      setJsonData(updatedData);
    } catch (saveError) {
      console.error('Error saving lean canvas changes:', saveError);
      setError('Failed to save your changes. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading your Lean Canvas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="text-lg text-red-500">{error}</div>
        <Link to="/documents">
          <Button variant="outline">Back to Documents</Button>
        </Link>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Laptop className="h-16 w-16 mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold mb-2">Desktop View Recommended</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Mobile layout coming soon. Please use a desktop device to view and edit your Lean Canvas.
        </p>
        <Link to="/documents">
          <Button>Return to Documents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <LeanCanvasProvider leanCanvas={leanCanvas}>
        <LeanCanvasDesktop 
          leanCanvas={leanCanvas}
          jsonData={jsonData}
          onDataChange={handleDataChange}
        />
      </LeanCanvasProvider>
    </div>
  );
} 