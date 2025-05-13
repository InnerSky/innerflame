import { useEffect, useRef, useState } from 'react';

// Add Calendly to the window type
declare global {
  interface Window {
    Calendly?: any;
  }
}

interface CalendlyEmbedProps {
  url?: string;
  backgroundColor?: string;
  textColor?: string;
  primaryColor?: string;
  height?: number | string;
  minWidth?: number;
  className?: string;
  hideScrollbar?: boolean;
}

export function CalendlyEmbed({
  url = 'https://calendly.com/poyen-northmirror/30min',
  backgroundColor = 'f8f8f8',
  textColor = '313131',
  primaryColor = 'ffa200',
  height = 700,
  minWidth = 320,
  className = '',
  hideScrollbar = false,
}: CalendlyEmbedProps) {
  const calendlyRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | string>(height);
  const [embedUrl, setEmbedUrl] = useState<string>('');

  // Update the URL whenever color props change
  useEffect(() => {
    const newUrl = `${url}?background_color=${backgroundColor}&text_color=${textColor}&primary_color=${primaryColor}`;
    setEmbedUrl(newUrl);

    // Clear and recreate the Calendly embed when colors change
    if (calendlyRef.current) {
      // Remove any existing Calendly elements
      while (calendlyRef.current.firstChild) {
        calendlyRef.current.removeChild(calendlyRef.current.firstChild);
      }
      
      // Update the data-url attribute
      calendlyRef.current.setAttribute('data-url', newUrl);
      
      // Re-initialize Calendly
      if (window.Calendly) {
        window.Calendly.initInlineWidget({
          url: newUrl,
          parentElement: calendlyRef.current
        });
      }
    }
  }, [url, backgroundColor, textColor, primaryColor]);

  // Function to adjust height based on content
  const adjustHeight = () => {
    const iframes = calendlyRef.current?.querySelectorAll('iframe');
    iframes?.forEach(iframe => {
      try {
        // Try to adjust iframe attributes for better responsiveness
        iframe.style.width = '100%';
        iframe.setAttribute('scrolling', 'no');
        
        // Remove any inline height restrictions from Calendly's iframe
        if (iframe.contentDocument) {
          const calendlyElements = iframe.contentDocument.querySelectorAll('.calendly-spinner, .calendly-inline-widget');
          calendlyElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.height = '100%';
              el.style.minHeight = 'auto';
              el.style.maxHeight = 'none';
            }
          });
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
    });
  };

  // This effect handles loading the script and initial setup
  useEffect(() => {
    // For mobile devices, start with a larger height
    if (window.innerWidth <= 768) {
      setContainerHeight(typeof height === 'number' ? height + 200 : height);
    }

    // Setup resize listener to handle different device widths
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setContainerHeight(typeof height === 'number' ? height + 200 : height);
      } else {
        setContainerHeight(height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Load the Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Once Calendly is loaded, it will inject an iframe
    script.onload = () => {
      // Wait for Calendly to fully initialize
      setTimeout(adjustHeight, 1000);
    };

    // Apply additional styling to handle scrollbars
    if (hideScrollbar && calendlyRef.current) {
      // Give time for Calendly to initialize
      const timer = setTimeout(() => {
        // Find any iframes created by Calendly
        const iframes = calendlyRef.current?.querySelectorAll('iframe');
        iframes?.forEach(iframe => {
          // Set iframe to fill container and disable scrolling
          iframe.style.width = '100%';
          iframe.setAttribute('scrolling', 'no');
          
          // Try to access iframe content if same origin
          try {
            if (iframe.contentDocument) {
              const style = document.createElement('style');
              style.textContent = `
                body, html { 
                  overflow: visible !important;
                  height: auto !important;
                  width: 100% !important;
                }
                ::-webkit-scrollbar { 
                  display: none !important; 
                }
                .calendly-inline-widget {
                  overflow: visible !important;
                  height: auto !important;
                  min-height: auto !important;
                }
                .calendar-day, .calendar-weekdays {
                  width: 100% !important;
                }
              `;
              iframe.contentDocument.head.appendChild(style);
            }
          } catch (e) {
            console.log('Cannot access iframe content due to same-origin policy');
          }
        });
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
        document.body.removeChild(script);
      };
    }

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.removeChild(script);
    };
  }, [hideScrollbar, height]);

  // Calculate style based on height type
  const styleObj = {
    minWidth: `${minWidth}px`,
    height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
    overflow: hideScrollbar ? 'visible' : undefined,
    width: '100%',
  };

  return (
    <div 
      ref={calendlyRef}
      className={`calendly-inline-widget ${className}`} 
      data-url={embedUrl || `${url}?background_color=${backgroundColor}&text_color=${textColor}&primary_color=${primaryColor}`}
      style={styleObj}
    />
  );
} 