import { Router } from 'express';
import { env, flags } from '../config/env.js';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const chatSessions = await checkChatSessionsHealth();

  res.json({
    status: 'ok',
    service: 'personal-data-pipeline-api',
    aiProvider: env.aiProvider,
    chatSessions,
    ollama: flags.hasOllama,
    ollamaModel: env.ollama.model || null,
    ai: {
      provider: env.aiProvider,
      ollamaConfigured: flags.hasOllama,
      ollamaModel: env.ollama.model || null
    },
    integrations: {
      githubOauth: flags.hasGithubOAuth,
      supabase: flags.hasSupabase,
      chatSessions,
      aiProvider: env.aiProvider,
      ollama: flags.hasOllama,
      anthropic: flags.hasAnthropic,
      n8nWebhook: flags.hasN8nWebhook
    }
  });
});

async function checkChatSessionsHealth() {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('chat_sessions').select('id', { head: true, count: 'exact' }).limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default router;
