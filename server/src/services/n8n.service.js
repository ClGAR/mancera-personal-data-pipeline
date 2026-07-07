import axios from 'axios';
import { env, flags } from '../config/env.js';

export async function notifyN8nSyncComplete(payload) {
  if (!flags.hasN8nWebhook) {
    return {
      delivered: false,
      reason: 'N8N_WEBHOOK_URL is not configured'
    };
  }

  const { status, data } = await axios.post(env.n8n.webhookUrl, payload, {
    timeout: 8000
  });

  return {
    delivered: true,
    status,
    data
  };
}
