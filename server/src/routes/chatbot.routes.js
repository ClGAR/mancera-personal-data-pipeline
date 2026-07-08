import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { answerChatbotQuestion } from '../services/chatbot.service.js';

const router = Router();

router.post('/ask', requireAuth, async (req, res, next) => {
  try {
    const question = String(req.body?.question || '').trim();

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    const mode = String(req.body?.mode || 'auto').trim().toLowerCase();
    const answer = await answerChatbotQuestion(req.user, question, mode);
    return res.json(answer);
  } catch (error) {
    next(error);
  }
});

export default router;
