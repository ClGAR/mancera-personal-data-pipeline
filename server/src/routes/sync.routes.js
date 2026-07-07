import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getRecentSyncRuns } from '../services/stats.service.js';
import { syncUserGitHubActivity } from '../services/sync.service.js';

const router = Router();

router.post('/now', requireAuth, async (req, res, next) => {
  try {
    const result = await syncUserGitHubActivity(req.user);
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/runs', requireAuth, async (req, res, next) => {
  try {
    const runs = await getRecentSyncRuns(req.user);
    res.json(runs);
  } catch (error) {
    next(error);
  }
});

export default router;
