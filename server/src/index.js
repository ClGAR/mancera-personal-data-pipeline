import { env, flags } from './config/env.js';
import app from './app.js';
import { startSyncCron } from './jobs/syncCron.js';

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
  console.log(`Supabase configured: ${flags.hasSupabase}`);
  console.log(`GitHub OAuth configured: ${flags.hasGithubOAuth}`);
  console.log(`AI provider: ${env.aiProvider}`);
  console.log(`Ollama configured: ${flags.hasOllama}`);
  console.log(`Anthropic configured: ${flags.hasAnthropic}`);
});

startSyncCron();

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
