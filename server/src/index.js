import app from './app.js';
import { env } from './config/env.js';
import { startSyncCron } from './jobs/syncCron.js';

const server = app.listen(env.port, () => {
  console.log(`Personal Data Pipeline API listening on http://localhost:${env.port}`);
});

startSyncCron();

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
