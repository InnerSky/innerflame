import express, { Router } from 'express';
import { createHistory } from '../controllers/history.js';
import { authenticateUser } from '../middleware/auth.js'; // Assuming you have this middleware

const router: Router = express.Router();

/**
 * History API routes
 * 
 * These routes handle operations related to message history summaries.
 */

/**
 * POST /history
 * Creates a new history summary from a list of message IDs
 * 
 * Request body:
 * {
 *   messageIds: string[]  // Array of message IDs to include in the summary
 * }
 * 
 * Response:
 * {
 *   historyId: string  // ID of the created history entry
 * }
 * 
 * Authorization: Requires authentication
 */
router.post('/', authenticateUser, createHistory);

export default router; 