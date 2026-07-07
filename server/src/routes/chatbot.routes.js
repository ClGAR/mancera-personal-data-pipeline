import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { answerGitHubQuestion } from '../services/chatbot.service.js';

const router = Router();

router.post('/ask', requireAuth, async (req, res, next) => {
  try {
    const question = String(req.body?.question || '').trim();

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    const answer = await answerGitHubQuestion(req.user, question);
    return res.json(answer);
  } catch (error) {
    next(error);
  }
});

export default router;
