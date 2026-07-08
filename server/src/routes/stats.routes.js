import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getSyncHistory, getTopRepos, getWeeklyStats } from '../services/stats.service.js';
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

router.get('/sync-history', requireAuth, async (req, res, next) => {
  try {
    const history = await getSyncHistory(req.user);
    res.json(history);
  } catch (error) {
    console.warn('Sync history lookup failed.', {
      message: sanitizeLogMessage(error.message || 'Unknown sync history error'),
      code: error.code || 'unknown'
    });

    const safeError = new Error('Unable to load sync history.');
    safeError.statusCode = error.statusCode || error.status || 500;
    next(safeError);
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

function sanitizeLogMessage(message) {
  return String(message || '')
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, '[redacted]');
}
