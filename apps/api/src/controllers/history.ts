import { Request, Response } from 'express';
import { createHistorySummary } from '../services/history/index.js';

/**
 * Create a history summary from message IDs
 * 
 * This controller handles POST requests to create a new history summary.
 * It creates a history entry with empty content first, allowing the
 * frontend to immediately display a loading state and subscribe to updates.
 * Then, it processes the messages in the background and updates the history
 * with the generated content.
 */
export async function createHistory(req: Request, res: Response) {
  try {
    const { messageIds } = req.body;
    
    // Validate request
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Valid messageIds array is required'
      });
    }
    
    // Get authenticated user ID from request
    // Note: This assumes an auth middleware has set req.user
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }
    
    // Create history summary
    const result = await createHistorySummary(messageIds, userId);
    
    // Return the history ID, which the frontend can use to subscribe to updates
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error creating history:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create history summary'
    });
  }
} 