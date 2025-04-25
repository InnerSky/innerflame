import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TrackingService } from '@innerflame/utils';
import { EventOptions, EventCategory, EventAction } from '@innerflame/types/src/userEvents.js';
import { useAuth } from './AuthContext.js';
import { supabase } from '@/lib/supabase.js';

interface TrackingContextType {
  isReady: boolean;
  trackEvent: (category: EventCategory, action: EventAction, options?: EventOptions) => Promise<void>;
  trackPageView: (pageName: string, options?: EventOptions) => Promise<void>;
  trackButtonClick: (buttonName: string, options?: EventOptions) => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function useTracking() {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}

interface TrackingProviderProps {
  children: ReactNode;
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const { user } = useAuth();
  const [trackingService, setTrackingService] = useState<TrackingService | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize or update tracking service when user changes
  useEffect(() => {
    // Don't initialize if no user is available yet
    if (!user) {
      setIsReady(false);
      return;
    }

    if (!trackingService) {
      // First initialization
      const newTrackingService = new TrackingService({
        supabase,
        userId: user.id,
      });
      setTrackingService(newTrackingService);
      setIsReady(true);
    } else if (trackingService.isReady() && user.id) {
      // User ID changed - update the existing service
      trackingService.updateUserId(user.id);
      setIsReady(true);
    }
  }, [user, trackingService]);

  // Track page views on route changes
  useEffect(() => {
    if (!trackingService || !isReady) return;

    const trackInitialPageView = async () => {
      try {
        const pagePath = window.location.pathname;
        const pageName = pagePath === '/' ? 'home' : pagePath.substring(1).replace(/\//g, '_');
        await trackingService.trackPageView(pageName);
      } catch (error) {
        console.error('Failed to track initial page view:', error);
      }
    };

    trackInitialPageView();

    // Set up listener for future navigation events
    const handleRouteChange = async (url: string) => {
      try {
        const pageName = url === '/' ? 'home' : url.substring(1).replace(/\//g, '_');
        await trackingService.trackPageView(pageName);
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    // This would normally use router events but keeping it simple for now
    // If you're using react-router or similar, you'd use its navigation events
    
    return () => {
      // Clean up event listeners if needed
    };
  }, [trackingService, isReady]);

  // Provide tracking methods
  const trackEvent = async (category: EventCategory, action: EventAction, options?: EventOptions) => {
    if (!trackingService || !isReady) return;
    await trackingService.trackEvent(category, action, options);
  };

  const trackPageView = async (pageName: string, options?: EventOptions) => {
    if (!trackingService || !isReady) return;
    await trackingService.trackPageView(pageName, options);
  };

  const trackButtonClick = async (buttonName: string, options?: EventOptions) => {
    if (!trackingService || !isReady) return;
    await trackingService.trackButtonClick(buttonName, options);
  };

  const value = {
    isReady,
    trackEvent,
    trackPageView,
    trackButtonClick,
  };

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
} 