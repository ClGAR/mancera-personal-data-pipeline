import { Router } from 'express';
import { env, flags } from '../config/env.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'personal-data-pipeline-api',
    aiProvider: env.aiProvider,
    ollama: flags.hasOllama,
    integrations: {
      githubOauth: flags.hasGithubOAuth,
      supabase: flags.hasSupabase,
      aiProvider: env.aiProvider,
      ollama: flags.hasOllama,
      anthropic: flags.hasAnthropic,
      n8nWebhook: flags.hasN8nWebhook
    }
  });
});

export default router;
