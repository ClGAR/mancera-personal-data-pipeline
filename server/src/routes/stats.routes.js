import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getTopRepos, getWeeklyStats } from '../services/stats.service.js';
import { syncUserGitHubActivity } from '../services/sync.service.js';

const router = Router();

router.get('/weekly', requireAuth, async (req, res, next) => {
  try {
    const stats = await getWeeklyStats(req.user);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/top-repos', requireAuth, async (req, res, next) => {
  try {
    const repos = await getTopRepos(req.user);
    res.json(repos);
  } catch (error) {
    next(error);
  }
});

router.post('/sync', requireAuth, async (req, res, next) => {
  try {
    const result = await syncUserGitHubActivity(req.user);
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
