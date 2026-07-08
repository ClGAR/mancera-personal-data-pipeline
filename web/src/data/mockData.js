export const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'weeklyStats', label: 'Weekly Stats' },
  { id: 'topRepos', label: 'Top Repos' },
  { id: 'syncHistory', label: 'Sync History' },
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'settings', label: 'Settings' }
];

export const pageMeta = {
  overview: {
    title: 'Overview',
    subtitle: 'Your GitHub activity pipeline at a glance.',
    actionLabel: 'Sync Now'
  },
  weeklyStats: {
    title: 'Weekly Stats',
    subtitle: 'Your weekly commit insights and activity overview.',
    actionLabel: 'Sync Now'
  },
  topRepos: {
    title: 'Top Repositories',
    subtitle: 'Your most active repositories ranked by commits.',
    actionLabel: 'Sync Now'
  },
  syncHistory: {
    title: 'Sync History',
    subtitle: 'View and monitor all your data synchronization runs.',
    actionLabel: 'Run Manual Sync'
  },
  chatbot: {
    title: 'GitHub Data Assistant',
    subtitle: 'Ask questions about your GitHub activity, repositories, and coding patterns.',
    actionLabel: 'New Chat'
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect and manage the services that power your data pipeline.',
    actionLabel: ''
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account, preferences, and data pipeline.',
    actionLabel: 'Sync Now'
  }
};

export const overviewStats = [
  {
    label: 'Weekly Commits',
    value: '162',
    change: '+23% vs last week',
    tone: 'primary',
    trendTone: 'success',
    sparkline: [22, 26, 24, 35, 29, 42, 27, 36, 31, 39, 34]
  },
  {
    label: 'Active Repositories',
    value: '14',
    change: '+3 vs last week',
    tone: 'success',
    trendTone: 'success',
    sparkline: [12, 13, 12, 16, 14, 19, 16, 18, 15, 18, 17]
  },
  {
    label: 'Current Streak',
    value: '21 days',
    change: 'Keep it up!',
    tone: 'highlight',
    trendTone: 'highlight',
    sparkline: [7, 8, 8, 10, 7, 11, 9, 13, 8, 11, 10]
  },
  {
    label: 'Last Sync Status',
    value: 'Success',
    change: 'May 19, 2025 09:21 AM',
    tone: 'status',
    trendTone: 'muted'
  }
];

export const overviewActivity = [
  { label: 'Mar 3', value: 50 },
  { label: 'Mar 10', value: 78 },
  { label: 'Mar 17', value: 126 },
  { label: 'Mar 24', value: 128 },
  { label: 'Mar 31', value: 158 },
  { label: 'Apr 7', value: 132 },
  { label: 'Apr 14', value: 204 },
  { label: 'Apr 21', value: 182 },
  { label: 'Apr 28', value: 128 },
  { label: 'May 5', value: 156 },
  { label: 'May 12', value: 218 },
  { label: 'May 19', value: 172 },
  { label: 'May 26', value: 128 },
  { label: 'Jun 2', value: 154 },
  { label: 'Jun 9', value: 126 }
];

export const overviewSyncJobs = [
  { id: 'run-1042', time: 'May 19, 09:12 AM', status: 'success', duration: '18s' },
  { id: 'run-1041', time: 'May 19, 08:12 AM', status: 'success', duration: '16s' },
  { id: 'run-1040', time: 'May 19, 07:12 AM', status: 'success', duration: '17s' },
  { id: 'run-1039', time: 'May 19, 06:12 AM', status: 'failed', duration: '-' },
  { id: 'run-1038', time: 'May 19, 05:12 AM', status: 'success', duration: '15s' }
];

export const overviewIntegrations = [
  { name: 'Supabase', status: 'Connected', type: 'supabase' },
  { name: 'GitHub', status: 'Connected', type: 'github' },
  { name: 'n8n Webhook', status: 'Connected', type: 'webhook' },
  { name: 'Ollama Local AI', status: 'Connected', type: 'ai' }
];

export const overviewRepos = [
  { name: 'alexjohnson/portfolio', type: 'site', commits: 48, lastActivity: 'May 19, 2025', trend: [7, 13, 9, 18, 14, 27, 19, 31, 23, 29, 25] },
  { name: 'alexjohnson/data-pipeline', type: 'database', commits: 36, lastActivity: 'May 18, 2025', trend: [8, 10, 9, 15, 14, 25, 17, 29, 22, 27, 20] },
  { name: 'alexjohnson/cli-tools', type: 'terminal', commits: 22, lastActivity: 'May 17, 2025', trend: [4, 9, 12, 8, 5, 10, 13, 15, 9, 12, 8] },
  { name: 'alexjohnson/notes', type: 'notes', commits: 12, lastActivity: 'May 15, 2025', trend: [5, 6, 4, 8, 5, 12, 9, 10, 8, 7, 6] },
  { name: 'alexjohnson/supabase-starter', type: 'supabase', commits: 10, lastActivity: 'May 14, 2025', trend: [3, 6, 8, 4, 2, 7, 5, 9, 8, 7, 6] }
];

export const weeklyStats = [
  { label: 'Total Commits', value: '128', change: '+18% vs last week', tone: 'primary', trendTone: 'success', sparkline: [20, 26, 22, 34, 28, 39, 24, 31, 27, 35, 29] },
  { label: 'Best Day', value: '32', change: 'May 14, 2025', tone: 'success', trendTone: 'muted', sparkline: [4, 6, 5, 9, 8, 14, 10, 15, 11, 16, 13] },
  { label: 'Avg Commits/Day', value: '18.3', change: '7-day average', tone: 'highlight', trendTone: 'muted', sparkline: [9, 11, 10, 14, 11, 17, 12, 18, 13, 16, 14] },
  { label: 'Weekly Growth', value: '+18%', change: 'vs May 4 - May 11', tone: 'status', trendTone: 'muted', sparkline: [7, 8, 7, 10, 8, 12, 9, 11, 9, 10, 9] }
];

export const dailyCommitActivity = [
  { label: 'May 12', subLabel: 'Mon', value: 12 },
  { label: 'May 13', subLabel: 'Tue', value: 18 },
  { label: 'May 14', subLabel: 'Wed', value: 32 },
  { label: 'May 15', subLabel: 'Thu', value: 21 },
  { label: 'May 16', subLabel: 'Fri', value: 19 },
  { label: 'May 17', subLabel: 'Sat', value: 14 },
  { label: 'May 18', subLabel: 'Sun', value: 12 }
];

export const dayBreakdown = [
  { day: 'Wednesday', date: 'May 14, 2025', commits: 32, previous: '+14 (77.8%)', status: 'up', trend: [8, 12, 10, 16, 11, 19, 14, 17, 15] },
  { day: 'Thursday', date: 'May 15, 2025', commits: 21, previous: '-11 (-34.4%)', status: 'down', trend: [15, 18, 13, 10, 12, 9, 8, 7, 6] },
  { day: 'Friday', date: 'May 16, 2025', commits: 19, previous: '-2 (-9.5%)', status: 'down', trend: [12, 14, 11, 9, 10, 8, 9, 7, 8] },
  { day: 'Tuesday', date: 'May 13, 2025', commits: 18, previous: '+6 (50.0%)', status: 'up', trend: [6, 8, 9, 12, 15, 10, 12, 11, 13] },
  { day: 'Saturday', date: 'May 17, 2025', commits: 14, previous: '-5 (-26.3%)', status: 'down', trend: [7, 8, 9, 12, 9, 7, 6, 6, 7] },
  { day: 'Monday', date: 'May 12, 2025', commits: 12, previous: '-', status: 'flat', trend: [] },
  { day: 'Sunday', date: 'May 18, 2025', commits: 12, previous: '-', status: 'flat', trend: [] }
];

export const topRepoHighlights = [
  {
    title: 'Most Active Repo',
    repo: 'alexjohnson/portfolio',
    value: '128 commits',
    change: '+18% more than last 30 days',
    tone: 'primary',
    trend: [8, 14, 16, 22, 20, 31, 26, 34, 25, 32, 28]
  },
  {
    title: 'Fastest Growing Repo',
    repo: 'alexjohnson/supabase-starter',
    value: '+240%',
    change: 'commit growth',
    tone: 'success',
    trend: [4, 6, 8, 12, 15, 19, 23, 29, 32, 35, 42]
  }
];

export const repositories = [
  { rank: 1, name: 'alexjohnson/portfolio', type: 'site', language: 'TypeScript', commits: 128, lastActivity: 'May 19, 2025', visibility: 'Public', trend: [8, 12, 11, 16, 18, 14, 17, 20, 15, 19, 17] },
  { rank: 2, name: 'alexjohnson/data-pipeline', type: 'database', language: 'Python', commits: 86, lastActivity: 'May 18, 2025', visibility: 'Private', trend: [6, 8, 7, 12, 10, 13, 15, 17, 14, 16, 12] },
  { rank: 3, name: 'alexjohnson/cli-tools', type: 'terminal', language: 'TypeScript', commits: 54, lastActivity: 'May 17, 2025', visibility: 'Public', trend: [5, 8, 7, 9, 8, 10, 11, 13, 12, 10, 9] },
  { rank: 4, name: 'alexjohnson/notes', type: 'notes', language: 'Markdown', commits: 42, lastActivity: 'May 15, 2025', visibility: 'Private', trend: [7, 9, 8, 12, 9, 11, 10, 8, 9, 7, 6] },
  { rank: 5, name: 'alexjohnson/supabase-starter', type: 'supabase', language: 'TypeScript', commits: 38, lastActivity: 'May 14, 2025', visibility: 'Public', trend: [3, 6, 7, 10, 9, 13, 11, 15, 14, 17, 18] },
  { rank: 6, name: 'alexjohnson/blog', type: 'docs', language: 'JavaScript', commits: 26, lastActivity: 'May 13, 2025', visibility: 'Public', trend: [4, 6, 7, 6, 8, 9, 10, 12, 11, 12, 10] },
  { rank: 7, name: 'alexjohnson/todo-app', type: 'app', language: 'TypeScript', commits: 18, lastActivity: 'May 12, 2025', visibility: 'Private', trend: [10, 12, 13, 11, 8, 7, 9, 8, 7, 6, 7] },
  { rank: 8, name: 'alexjohnson/api-client', type: 'app', language: 'Python', commits: 15, lastActivity: 'May 11, 2025', visibility: 'Private', trend: [3, 5, 8, 10, 11, 12, 9, 10, 8, 7, 6] }
];

export const syncHistory = [
  { time: 'May 19, 2025 09:12 AM', relative: '2 minutes ago', status: 'success', duration: '18s', repositories: 12, commits: 128, error: '-' },
  { time: 'May 19, 2025 08:12 AM', relative: '1 hour ago', status: 'success', duration: '16s', repositories: 12, commits: 87, error: '-' },
  { time: 'May 19, 2025 07:12 AM', relative: '2 hours ago', status: 'success', duration: '17s', repositories: 12, commits: 64, error: '-' },
  { time: 'May 19, 2025 06:12 AM', relative: '3 hours ago', status: 'failed', duration: '22s', repositories: 12, commits: 0, error: 'Rate limit exceeded' },
  { time: 'May 19, 2025 05:12 AM', relative: '4 hours ago', status: 'success', duration: '15s', repositories: 11, commits: 53, error: '-' },
  { time: 'May 18, 2025 11:12 PM', relative: '18 hours ago', status: 'success', duration: '19s', repositories: 11, commits: 91, error: '-' },
  { time: 'May 18, 2025 05:12 PM', relative: '1 day ago', status: 'success', duration: '17s', repositories: 11, commits: 72, error: '-' },
  { time: 'May 18, 2025 02:12 PM', relative: '1 day ago', status: 'success', duration: '14s', repositories: 11, commits: 46, error: '-' },
  { time: 'May 18, 2025 10:12 AM', relative: '1 day ago', status: 'failed', duration: '20s', repositories: 10, commits: 0, error: 'Network error. Please try again.' },
  { time: 'May 18, 2025 09:12 AM', relative: '1 day ago', status: 'success', duration: '17s', repositories: 10, commits: 38, error: '-' }
];

export const suggestedPrompts = [
  'Which repo had the most commits this month?',
  'Show my top coding languages by commits',
  'What was my longest streak of commits?',
  'Who do I collaborate with the most?',
  'Summarize my activity over the last 3 months',
  'Which issues do I resolve the most?'
];

export const languageBreakdown = [
  { language: 'TypeScript', percent: 54, commits: 312, color: '#1d9bd7' },
  { language: 'JavaScript', percent: 21, commits: 119, color: '#f7df1e' },
  { language: 'Python', percent: 12, commits: 69, color: '#3572a5' },
  { language: 'Markdown', percent: 7, commits: 41, color: '#475467' },
  { language: 'JSON', percent: 6, commits: 34, color: '#6b5b00' }
];

export const integrationCards = [
  {
    title: 'GitHub OAuth',
    type: 'github',
    description: 'Connect your GitHub account to sync repositories, commits, and activity data.',
    status: 'Connected',
    details: [
      ['Connected as', 'alexjohnson'],
      ['Last synced', 'May 19, 2025 09:12 AM']
    ]
  },
  {
    title: 'Supabase',
    type: 'supabase',
    description: 'Store and manage your data securely in your Supabase project.',
    status: 'Connected',
    details: [
      ['Project', 'personal-pipeline'],
      ['Region', 'us-east-1']
    ]
  },
  {
    title: 'n8n Webhook',
    type: 'webhook',
    description: 'Send pipeline events and sync updates to your n8n workflows via webhook.',
    status: 'Connected',
    details: [
      ['Webhook URL', 'https://n8n.example.com/webhook'],
      ['Last received', 'May 19, 2025 08:58 AM']
    ]
  },
  {
    title: 'Ollama Local AI',
    type: 'ai',
    description: 'Run AI-powered insights locally and ask natural language questions about your data.',
    status: 'Connected',
    details: [
      ['Model', 'llama3.2'],
      ['Provider', 'Local Ollama']
    ]
  },
  {
    title: 'Email Notifications',
    type: 'email',
    description: 'Receive important pipeline alerts, summaries, and updates in your inbox.',
    status: 'Not Configured',
    details: [
      ['Email', '-'],
      ['Frequency', '-']
    ]
  },
  {
    title: 'Slack Notifications',
    type: 'slack',
    description: 'Get real-time notifications and alerts delivered to your Slack workspace.',
    status: 'Not Configured',
    details: [
      ['Workspace', '-'],
      ['Channel', '-']
    ]
  }
];

export const accountSummary = [
  ['Member since', 'Jan 15, 2025'],
  ['Total syncs', '28'],
  ['Total data points', '12,458'],
  ['Last sync', 'May 19, 2025 09:12 AM']
];
