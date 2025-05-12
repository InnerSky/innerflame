import express, { Request, Response, Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { acceptVersion, rejectVersion } from '../services/documents/documentApprovalService.js';

const router: Router = express.Router();

// Document version approval routes
router.post('/versions/:versionId/accept', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await acceptVersion(versionId, userId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error accepting version:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error accepting version'
    });
  }
});

router.post('/versions/:versionId/reject', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await rejectVersion(versionId, userId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    return res.status(200).json({ 
      success: true,
      restoredVersionId: result.restoredVersionId
    });
  } catch (error) {
    console.error('Error rejecting version:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error rejecting version'
    });
  }
});

export default router;