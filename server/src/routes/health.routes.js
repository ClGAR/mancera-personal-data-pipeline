import { Router } from 'express';
import { flags } from '../config/env.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'personal-data-pipeline-api',
    integrations: {
      githubOAuth: flags.hasGithubOAuth,
      supabase: flags.hasSupabase,
      anthropic: flags.hasAnthropic,
      n8nWebhook: flags.hasN8nWebhook
    }
  });
});

export default router;
