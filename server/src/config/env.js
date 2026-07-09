import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../..');
const serverEnvPath = path.join(serverRoot, '.env');

dotenv.config({ path: serverEnvPath });

const n8nWebhookPlaceholderValues = new Set([
  'your-n8n-webhook-url',
  'your_webhook_url',
  'https://your-n8n-webhook-url'
]);
const n8nWebhookPlaceholderHosts = new Set(['your-n8n-webhook-url', 'your_webhook_url']);
const placeholderValues = new Set([
  'your-api-key',
  'your_api_key',
  'your-anthropic-api-key',
  'your_anthropic_api_key',
  'your-anthropic-api-key-here',
  'your_anthropic_api_key_here',
  'your-model-name',
  'your_model_name_here',
  'your-ollama-model',
  'your_ollama_model',
  'your-ollama-url',
  'your_ollama_url',
  'http://your-ollama-url',
  'https://your-ollama-url',
  'changeme',
  'change-me',
  'placeholder'
]);

const optional = (value, fallback = '') => value || fallback;
const normalizeProvider = (value) => {
  const provider = String(value || 'ollama').trim().toLowerCase();
  return provider === 'anthropic' ? 'anthropic' : 'ollama';
};
const isConfiguredValue = (value) => {
  const trimmed = String(value || '').trim();
  const normalized = trimmed.toLowerCase();
  return Boolean(trimmed && !placeholderValues.has(normalized));
};
const isValidHttpUrl = (value, placeholderHosts = new Set()) => {
  const trimmed = String(value || '').trim();
  const normalized = trimmed.toLowerCase().replace(/\/+$/, '');
  if (!trimmed || n8nWebhookPlaceholderValues.has(normalized) || placeholderValues.has(normalized)) return false;

  try {
    const url = new URL(trimmed);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !placeholderHosts.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
};

export const env = {
  appTimezone: optional(process.env.APP_TIMEZONE, 'Asia/Manila').trim() || 'Asia/Manila',
  aiProvider: normalizeProvider(process.env.AI_PROVIDER),
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
    apiKey: optional(process.env.ANTHROPIC_API_KEY).trim(),
    model: optional(process.env.ANTHROPIC_MODEL, 'claude-3-5-sonnet-latest').trim()
  },
  ollama: {
    baseUrl: optional(process.env.OLLAMA_BASE_URL).trim().replace(/\/+$/, ''),
    model: optional(process.env.OLLAMA_MODEL).trim()
  },
  n8n: {
    webhookUrl: optional(process.env.N8N_WEBHOOK_URL).trim()
  },
  cron: {
    enabled: process.env.CRON_ENABLED !== 'false',
    schedule: optional(process.env.CRON_SCHEDULE, '0 * * * *')
  }
};

export const flags = {
  hasGithubOAuth: Boolean(env.github.clientId && env.github.clientSecret),
  hasSupabase: Boolean(env.supabase.url && env.supabase.anonKey && env.supabase.serviceRoleKey),
  hasOllama:
    env.aiProvider === 'ollama' &&
    isValidHttpUrl(env.ollama.baseUrl, new Set(['your-ollama-url', 'your_ollama_url'])) &&
    isConfiguredValue(env.ollama.model),
  hasAnthropic: env.aiProvider === 'anthropic' && isConfiguredValue(env.anthropic.apiKey),
  hasN8nWebhook: isValidHttpUrl(env.n8n.webhookUrl, n8nWebhookPlaceholderHosts)
};
