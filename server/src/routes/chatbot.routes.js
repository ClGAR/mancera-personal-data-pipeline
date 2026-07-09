import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  clearUserMemories,
  createChatSession,
  createUserMemory,
  deleteChatSession,
  deleteUserMemory,
  getAssistantPreferences,
  getChatSessionMessages,
  listChatSessions,
  listUserMemories,
  normalizeChatPersistenceError,
  sanitizePersistenceLogMessage,
  updateAssistantPreferences
} from '../services/chatMemory.service.js';
import { answerChatbotQuestion } from '../services/chatbot.service.js';

const router = Router();

router.post('/ask', async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    const mode = String(req.body?.mode || 'auto').trim().toLowerCase();
    const sessionId = String(req.body?.sessionId || '').trim() || null;
    const memoryEnabled = req.body?.memoryEnabled !== false;
    const answer = await answerChatbotQuestion(req.user || null, question, mode, {
      sessionId,
      memoryEnabled
    });
    return res.json(answer);
  } catch (error) {
    console.warn('Chatbot route failed.', {
      message: error.message || 'Unknown chatbot route error'
    });

    return res.status(500).json({
      answer: 'The assistant hit a backend error. Please try again.',
      mode: 'general',
      source: 'error',
      usedLiveData: false
    });
  }
});

router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const sessions = await listChatSessions(req.user);
    return res.json({ sessions });
  } catch (error) {
    return sendChatPersistenceError(res, req, error, 'session_list');
  }
});

router.post('/sessions', requireAuth, async (req, res, next) => {
  try {
    const title = String(req.body?.title || 'New chat').trim() || 'New chat';
    const session = await createChatSession(req.user, title);
    return res.status(201).json({ session });
  } catch (error) {
    return sendChatPersistenceError(res, req, error, 'session_create');
  }
});

router.get('/sessions/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const messages = await getChatSessionMessages(req.user, req.params.id);
    return res.json({ messages });
  } catch (error) {
    return sendChatPersistenceError(res, req, error, 'session_messages');
  }
});

router.delete('/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteChatSession(req.user, req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    return sendChatPersistenceError(res, req, error, 'session_delete');
  }
});

router.get('/memories', requireAuth, async (req, res, next) => {
  try {
    const [items, preferences] = await Promise.all([listUserMemories(req.user), getAssistantPreferences(req.user)]);
    return res.json({ items, preferences });
  } catch (error) {
    next(error);
  }
});

router.post('/memories', requireAuth, async (req, res, next) => {
  try {
    const content = String(req.body?.content || '').trim();
    if (!content) {
      return res.status(400).json({ error: 'Memory content is required' });
    }

    const item = await createUserMemory(req.user, {
      memoryType: req.body?.memoryType || 'preference',
      content,
      confidence: Number(req.body?.confidence ?? 0.8)
    });
    return res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.patch('/preferences', requireAuth, async (req, res, next) => {
  try {
    const preferences = await updateAssistantPreferences(req.user, {
      memoryEnabled: req.body?.memoryEnabled,
      preferredTone: req.body?.preferredTone,
      preferredLanguageStyle: req.body?.preferredLanguageStyle,
      preferredAnswerLength: req.body?.preferredAnswerLength,
      preferredExplanationLevel: req.body?.preferredExplanationLevel
    });
    return res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

router.delete('/memories/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteUserMemory(req.user, req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/memories', requireAuth, async (req, res, next) => {
  try {
    await clearUserMemories(req.user);
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

function sendChatPersistenceError(res, req, error, operation) {
  const safeError = normalizeChatPersistenceError(error, operation);

  console.warn('Chat persistence route failed.', {
    operation,
    userId: req.user?.userId || req.user?.id || 'unknown',
    code: safeError.code,
    message: sanitizePersistenceLogMessage(error.message || 'Unknown chat persistence route error')
  });

  return res.status(safeError.status).json({
    error: safeError.code,
    message: safeError.message
  });
}

export default router;
