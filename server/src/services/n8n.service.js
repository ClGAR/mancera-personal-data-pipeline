import axios from 'axios';
import { env, flags } from '../config/env.js';

export async function notifyN8nSyncComplete(payload) {
  if (!flags.hasN8nWebhook) {
    console.warn('n8n webhook not configured; skipping notification.');
    return {
      delivered: false,
      skipped: true,
      reason: 'N8N_WEBHOOK_URL is not configured'
    };
  }

  try {
    const { status } = await axios.post(env.n8n.webhookUrl, payload, {
      timeout: 8000
    });

    return {
      delivered: true,
      status
    };
  } catch {
    console.warn('n8n webhook notification failed.');
    return {
      delivered: false,
      failed: true,
      warning: 'n8n webhook notification failed'
    };
  }
}
