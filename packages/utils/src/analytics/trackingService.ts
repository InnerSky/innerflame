import { SupabaseClient } from '@supabase/supabase-js';
import { EventCategory, EventAction, EventOptions, UserEvent } from '@innerflame/types/src/userEvents.js';

export interface TrackingServiceOptions {
  supabase: SupabaseClient;
  userId: string;
  sessionId?: string;
}

export class TrackingService {
  private supabase: SupabaseClient;
  private userId: string;
  private sessionId: string;
  private isInitialized = false;

  constructor(options: TrackingServiceOptions) {
    this.supabase = options.supabase;
    this.userId = options.userId;
    this.sessionId = options.sessionId || this.generateSessionId();
    this.isInitialized = true;
  }

  /**
   * Generate a random session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get current browser information
   */
  private getBrowserInfo(): { url: string; referrer: string; user_agent: string } {
    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  /**
   * Track a user event
   */
  public async trackEvent(
    category: EventCategory,
    action: EventAction,
    options?: EventOptions
  ): Promise<{ success: boolean; error?: any }> {
    if (!this.isInitialized || !this.userId) {
      return { success: false, error: 'Tracking service not properly initialized' };
    }

    try {
      const { url, referrer, user_agent } = this.getBrowserInfo();
      
      const event: UserEvent = {
        user_id: this.userId,
        session_id: this.sessionId,
        event_category: category,
        event_action: action,
        event_label: options?.label,
        event_value: options?.value,
        event_data: options?.data,
        client_timestamp: new Date().toISOString(),
        url,
        referrer,
        user_agent
      };

      const { data, error } = await this.supabase
        .from('user_events')
        .insert(event);

      if (error) {
        // If we get a rate limit error, don't treat it as a failure to the caller
        if (error.message?.includes('rate limit') || error.code === '23505') {
          console.warn('Event rate limit reached', { category, action });
          return { success: true };
        }
        
        console.error('Error tracking event:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in trackEvent:', error);
      return { success: false, error };
    }
  }

  /**
   * Track a page view
   */
  public async trackPageView(pageName: string, options?: EventOptions): Promise<{ success: boolean; error?: any }> {
    return this.trackEvent('navigation', `view_${pageName}`, options);
  }

  /**
   * Track a button click
   */
  public async trackButtonClick(buttonName: string, options?: EventOptions): Promise<{ success: boolean; error?: any }> {
    return this.trackEvent('interaction', `click_${buttonName}`, options);
  }

  /**
   * Update the user ID (useful for anonymous to authenticated user conversion)
   */
  public updateUserId(userId: string): void {
    this.userId = userId;
  }
  
  /**
   * Check if tracking is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && !!this.userId;
  }
} 