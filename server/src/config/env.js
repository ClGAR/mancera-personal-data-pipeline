import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../..');
const projectRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });

const optional = (value, fallback = '') => value || fallback;

export const env = {
  nodeEnv: optional(process.env.NODE_ENV, 'development'),
  port: Number(process.env.PORT || 4000),
  clientUrl: optional(process.env.CLIENT_URL, 'http://localhost:5173'),
  sessionSecret: optional(process.env.SESSION_SECRET, 'local-dev-session-secret-change-me'),
  github: {
    clientId: optional(process.env.GITHUB_CLIENT_ID),
    clientSecret: optional(process.env.GITHUB_CLIENT_SECRET),
    callbackUrl: optional(process.env.GITHUB_CALLBACK_URL, 'http://localhost:4000/auth/github/callback')
  },
  supabase: {
    url: optional(process.env.SUPABASE_URL),
    serviceRoleKey: optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
    anonKey: optional(process.env.SUPABASE_ANON_KEY)
  },
  anthropic: {
    apiKey: optional(process.env.ANTHROPIC_API_KEY),
    model: optional(process.env.ANTHROPIC_MODEL, 'claude-3-5-sonnet-latest')
  },
  n8n: {
    webhookUrl: optional(process.env.N8N_WEBHOOK_URL)
  },
  cron: {
    enabled: process.env.CRON_ENABLED !== 'false',
    schedule: optional(process.env.CRON_SCHEDULE, '0 * * * *')
  }
};

export const flags = {
  hasGithubOAuth: Boolean(env.github.clientId && env.github.clientSecret),
  hasSupabase: Boolean(env.supabase.url && env.supabase.serviceRoleKey),
  hasAnthropic: Boolean(env.anthropic.apiKey),
  hasN8nWebhook: Boolean(env.n8n.webhookUrl)
};
