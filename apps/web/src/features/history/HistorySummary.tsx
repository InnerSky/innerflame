import React, { useEffect, useState } from 'react';
import { createHistory } from '../../api/history/index.js';
import { subscribeToHistory } from './historySubscription.js';
import { getHistoryById } from './historyService.js';

interface HistorySummaryProps {
  messageIds: string[];
  onError?: (error: Error) => void;
  showExisting?: boolean; // Add prop to show existing history without creating a new one
  onHistoryCreated?: (historyId: string) => void; // Add callback for when history is created
}

/**
 * Component that creates and displays a history summary
 * 
 * This component handles:
 * 1. Creating a history entry when it mounts (if showExisting is false)
 * 2. Loading an existing history entry (if showExisting is true)
 * 3. Subscribing to real-time updates of the history
 * 4. Displaying a loading state while waiting
 * 5. Displaying the formatted summary when it's ready
 */
export function HistorySummary({ messageIds, onError, showExisting = false, onHistoryCreated }: HistorySummaryProps) {
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  // Step 1: Create or load history when component mounts
  useEffect(() => {
    async function initializeHistory() {
      if (!messageIds.length) return;
      
      // Prevent duplicate initialization
      if (historyId) {
        console.log(`HistorySummary: Already initialized with historyId ${historyId}, skipping`);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // If showExisting is true, we assume the first messageId is actually the historyId
        if (showExisting && messageIds.length > 0) {
          console.log(`HistorySummary: Loading existing history ${messageIds[0]}`);
          const existingHistory = await getHistoryById(messageIds[0]);
          setHistoryId(messageIds[0]);
          setHistory(existingHistory);
          
          // Trigger animation after a small delay
          setTimeout(() => {
            setFadeIn(true);
            setLoading(false);
          }, 100);
        } else {
          // Create a new history entry from message IDs
          console.log(`HistorySummary: Creating new history from ${messageIds.length} messages`);
          const result = await createHistory(messageIds);
          console.log(`HistorySummary: Created history with ID ${result.historyId}`);
          setHistoryId(result.historyId);
          
          // Notify parent component that history was created
          if (onHistoryCreated) {
            onHistoryCreated(result.historyId);
          }
        }
      } catch (err) {
        console.error('HistorySummary: Error during initialization:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create history';
        setError(errorMessage);
        if (onError) onError(err instanceof Error ? err : new Error(errorMessage));
        setLoading(false);
      }
    }
    
    initializeHistory();
  }, [messageIds, onError, showExisting, historyId, onHistoryCreated]);

  // Step 2: Subscribe to updates when historyId is available and we're creating a new history
  useEffect(() => {
    if (!historyId || (showExisting && history)) return;
    
    // Subscribe to history updates
    const unsubscribe = subscribeToHistory(historyId, (data) => {
      // Check if the content has been populated
      if (data?.content?.overview) {
        setHistory(data);
        
        // Trigger animation after a small delay
        setTimeout(() => {
          setFadeIn(true);
          setLoading(false);
        }, 100);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [historyId, showExisting, history]);

  // Render based on state
  if (error) {
    return (
      <div className="history-error" role="alert">
        <p>Unable to generate summary: {error}</p>
      </div>
    );
  }

  if (loading || !history?.content?.overview) {
    return (
      <div className="history-loading">
        <div className="pulse-animation"></div>
        <p>Generating summary...</p>
      </div>
    );
  }

  return (
    <div className={`history-summary ${fadeIn ? 'fade-in' : ''}`}>
      <div className="history-overview">
        <h3>Overview</h3>
        <p>{history.content.overview}</p>
      </div>
      
      <div className="history-spotlight">
        <h3>Spotlight</h3>
        <ul>
          {history.content.spotlight.map((item: string, index: number) => (
            <li key={index} className="spotlight-item">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Add component CSS - these styles can be moved to a separate CSS file
export const HistorySummaryStyles = `
  .history-summary {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
    background-color: #f9f9f9;
  }
  
  .history-summary.fade-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  .history-overview {
    margin-bottom: 1rem;
  }
  
  .history-overview h3, .history-spotlight h3 {
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }
  
  .spotlight-item {
    margin-bottom: 0.5rem;
    position: relative;
    padding-left: 1.5rem;
  }
  
  .spotlight-item:before {
    content: "•";
    position: absolute;
    left: 0.5rem;
    color: #0070f3;
  }
  
  .history-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    text-align: center;
  }
  
  .pulse-animation {
    width: 50px;
    height: 50px;
    background-color: rgba(0, 112, 243, 0.1);
    border-radius: 50%;
    margin-bottom: 1rem;
    animation: pulse 1.5s infinite ease-in-out;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 112, 243, 0.4);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(0, 112, 243, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 112, 243, 0);
    }
  }
`; 