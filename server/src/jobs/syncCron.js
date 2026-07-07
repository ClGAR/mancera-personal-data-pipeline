import cron from 'node-cron';
import { env } from '../config/env.js';
import { getStoredGitHubAccounts } from '../services/github.service.js';
import { syncGitHubAccount } from '../services/sync.service.js';

export function startSyncCron() {
  if (!env.cron.enabled) {
    console.log('Sync cron is disabled with CRON_ENABLED=false.');
    return null;
  }

  const task = cron.schedule(env.cron.schedule, async () => {
    try {
      const accounts = await getStoredGitHubAccounts();

      if (accounts.length === 0) {
        console.log('Sync cron skipped: no stored GitHub accounts found.');
        return;
      }

      for (const account of accounts) {
        try {
          await syncGitHubAccount(account);
          console.log(`Synced GitHub activity for ${account.username || account.user_id}.`);
        } catch (error) {
          console.error(`Sync failed for ${account.username || account.user_id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Sync cron failed:', error.message);
    }
  });

  console.log(`Sync cron scheduled with "${env.cron.schedule}".`);
  return task;
}
