import { useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import StatCard from './components/StatCard.jsx';
import CommitChart from './components/CommitChart.jsx';
import TopReposTable from './components/TopReposTable.jsx';
import SyncJobsCard from './components/SyncJobsCard.jsx';
import IntegrationsCard from './components/IntegrationsCard.jsx';
import ChatbotPanel from './components/ChatbotPanel.jsx';
import { api } from './api.js';
import { Activity, CheckCircle2, Flame, FolderGit2, RefreshCcw } from 'lucide-react';

const weeklyActivity = [
  { label: 'Mar 3', commits: 50 },
  { label: 'Mar 10', commits: 78 },
  { label: 'Mar 17', commits: 126 },
  { label: 'Mar 24', commits: 128 },
  { label: 'Mar 31', commits: 158 },
  { label: 'Apr 7', commits: 132 },
  { label: 'Apr 14', commits: 204 },
  { label: 'Apr 21', commits: 182 },
  { label: 'Apr 28', commits: 128 },
  { label: 'May 5', commits: 156 },
  { label: 'May 12', commits: 218 },
  { label: 'May 19', commits: 172 },
  { label: 'May 26', commits: 128 }
];

const topRepos = [
  {
    repoName: 'mancera/portfolio',
    type: 'site',
    commits30d: 48,
    lastActivity: 'May 19, 2025',
    trend: [7, 13, 9, 18, 14, 27, 19, 31, 23, 29, 25]
  },
  {
    repoName: 'mancera/data-pipeline',
    type: 'database',
    commits30d: 36,
    lastActivity: 'May 18, 2025',
    trend: [8, 10, 9, 15, 14, 25, 17, 29, 22, 27, 20]
  },
  {
    repoName: 'mancera/cli-tools',
    type: 'terminal',
    commits30d: 22,
    lastActivity: 'May 17, 2025',
    trend: [4, 9, 12, 8, 5, 10, 13, 15, 9, 12, 8]
  },
  {
    repoName: 'mancera/notes',
    type: 'notes',
    commits30d: 12,
    lastActivity: 'May 15, 2025',
    trend: [5, 6, 4, 8, 5, 12, 9, 10, 8, 7, 6]
  },
  {
    repoName: 'mancera/supabase-starter',
    type: 'supabase',
    commits30d: 10,
    lastActivity: 'May 14, 2025',
    trend: [3, 6, 8, 4, 2, 7, 5, 9, 8, 7, 6]
  }
];

const syncRuns = [
  { id: 'run-1042', status: 'success', created_at: 'May 19, 09:12 AM', duration: '18s' },
  { id: 'run-1041', status: 'success', created_at: 'May 19, 08:12 AM', duration: '16s' },
  { id: 'run-1040', status: 'success', created_at: 'May 19, 07:12 AM', duration: '17s' },
  { id: 'run-1039', status: 'failed', created_at: 'May 19, 06:12 AM', duration: '-' },
  { id: 'run-1038', status: 'success', created_at: 'May 19, 05:12 AM', duration: '15s' }
];

const integrations = [
  { name: 'Supabase', status: 'Connected', type: 'supabase' },
  { name: 'GitHub', status: 'Connected', type: 'github' },
  { name: 'n8n Webhook', status: 'Connected', type: 'webhook' },
  { name: 'Anthropic (Claude)', status: 'Connected', type: 'ai' }
];

function App() {
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('May 19, 2025 09:12 AM');

  const metrics = useMemo(
    () => [
      {
        label: 'Weekly Commits',
        value: '128',
        change: '18% vs last week',
        tone: 'primary',
        trendTone: 'success',
        icon: Activity,
        sparkline: [20, 26, 22, 34, 28, 39, 24, 31, 27, 35, 29]
      },
      {
        label: 'Active Repositories',
        value: '12',
        change: '2 vs last week',
        tone: 'success',
        trendTone: 'success',
        icon: FolderGit2,
        sparkline: [12, 13, 12, 15, 14, 17, 15, 16, 14, 16, 15]
      },
      {
        label: 'Current Streak',
        value: '14 days',
        change: 'Keep it up!',
        tone: 'highlight',
        trendTone: 'highlight',
        icon: Flame,
        sparkline: [6, 7, 7, 9, 6, 8, 8, 11, 7, 9, 8]
      },
      {
        label: 'Last Sync Status',
        value: syncing ? 'Running' : 'Success',
        change: syncNotice,
        tone: 'status',
        trendTone: 'muted',
        icon: syncing ? RefreshCcw : CheckCircle2
      }
    ],
    [syncNotice, syncing]
  );

  async function handleSyncNow() {
    setSyncing(true);
    setSyncNotice('Sync request sent');

    try {
      const result = await api.syncNow();
      setSyncNotice(`${result.reposSynced || 0} repos, ${result.commitsSynced || 0} commits`);
    } catch (error) {
      setSyncNotice('Backend not connected yet');
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <Topbar onSyncNow={handleSyncNow} syncing={syncing} />

        <section className="stats-grid" aria-label="Key metrics">
          {metrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="dashboard-grid">
          <CommitChart data={weeklyActivity} />
          <SyncJobsCard runs={syncRuns} />
          <IntegrationsCard integrations={integrations} />
          <TopReposTable repos={topRepos} />
          <ChatbotPanel />
        </section>
      </main>
    </div>
  );
}

export default App;
