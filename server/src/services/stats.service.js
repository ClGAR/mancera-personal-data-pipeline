import { supabase } from '../config/supabase.js';

const WEEK_DAYS = 7;
const SYNC_HISTORY_LIMIT = 50;

export async function getWeeklyStats(user) {
  if (!supabase || user.isDemo) return demoWeeklyStats();

  const userId = user.userId || user.user_id || user.id;
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * (WEEK_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [{ data: commits, error: commitsError }, { data: repos, error: reposError }, { data: runs, error: runsError }] =
    await Promise.all([
      supabase.from('commits').select('committed_at').eq('user_id', userId).gte('committed_at', since.toISOString()),
      supabase.from('repositories').select('id').eq('user_id', userId),
      supabase
        .from('sync_runs')
        .select('status, finished_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
    ]);

  if (commitsError) throw commitsError;
  if (reposError) throw reposError;
  if (runsError) throw runsError;

  const chart = buildWeeklyChart(commits || []);
  const weeklyCommits = (commits || []).length;

  return {
    cards: {
      weeklyCommits,
      activeRepositories: repos?.length || 0,
      currentStreak: calculateStreak(commits || []),
      lastSyncStatus: runs?.[0]?.status || 'not synced'
    },
    chart,
    lastSync: runs?.[0] || null
  };
}

export async function getTopRepos(user) {
  if (!supabase || user.isDemo) return demoTopRepos();

  const userId = user.userId || user.user_id || user.id;
  const { data, error } = await supabase
    .from('commits')
    .select('repo_name, committed_at')
    .eq('user_id', userId)
    .order('committed_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  const counts = new Map();
  for (const commit of data || []) {
    const repoName = commit.repo_name || 'unknown';
    counts.set(repoName, (counts.get(repoName) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([repoName, commits]) => ({
      repoName,
      commits,
      lastCommitAt: data.find((commit) => commit.repo_name === repoName)?.committed_at || null
    }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 8);
}

export async function getRecentSyncRuns(user) {
  if (!supabase || user.isDemo) return demoSyncRuns();

  const userId = user.userId || user.user_id || user.id;
  const { data, error } = await supabase
    .from('sync_runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

export async function getSyncHistory(user) {
  if (!supabase || user.isDemo) {
    return {
      items: []
    };
  }

  const userId = user.userId || user.user_id || user.id;
  const { data, error } = await supabase
    .from('sync_runs')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['success', 'failed'])
    .order('created_at', { ascending: false })
    .limit(SYNC_HISTORY_LIMIT);

  if (error) throw error;

  return {
    items: (data || []).map(mapSyncHistoryRun)
  };
}

export async function getChatbotContext(user) {
  const [weekly, topRepos, runs] = await Promise.all([getWeeklyStats(user), getTopRepos(user), getRecentSyncRuns(user)]);

  return {
    weekly,
    topRepos,
    recentSyncRuns: runs
  };
}

function buildWeeklyChart(commits) {
  const days = Array.from({ length: WEEK_DAYS }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (WEEK_DAYS - 1 - index));
    date.setHours(0, 0, 0, 0);

    return {
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      commits: 0
    };
  });

  for (const commit of commits) {
    const committedAt = new Date(commit.committed_at);
    const day = days.find((entry) => entry.date.toDateString() === committedAt.toDateString());
    if (day) day.commits += 1;
  }

  return days.map(({ date, ...entry }) => entry);
}

function calculateStreak(commits) {
  const committedDates = new Set(
    commits.map((commit) => {
      const date = new Date(commit.committed_at);
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    })
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (committedDates.has(cursor.toISOString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function demoWeeklyStats() {
  return {
    cards: {
      weeklyCommits: 42,
      activeRepositories: 8,
      currentStreak: 5,
      lastSyncStatus: 'success'
    },
    chart: [
      { label: 'Mon', commits: 5 },
      { label: 'Tue', commits: 9 },
      { label: 'Wed', commits: 4 },
      { label: 'Thu', commits: 11 },
      { label: 'Fri', commits: 7 },
      { label: 'Sat', commits: 3 },
      { label: 'Sun', commits: 3 }
    ],
    lastSync: {
      status: 'success',
      finished_at: new Date().toISOString()
    }
  };
}

function demoTopRepos() {
  return [
    { repoName: 'personal-data-pipeline', commits: 18, lastCommitAt: new Date().toISOString() },
    { repoName: 'inventory-dashboard', commits: 10, lastCommitAt: new Date(Date.now() - 86400000).toISOString() },
    { repoName: 'ecommerce-api', commits: 8, lastCommitAt: new Date(Date.now() - 172800000).toISOString() },
    { repoName: 'portfolio-site', commits: 6, lastCommitAt: new Date(Date.now() - 259200000).toISOString() }
  ];
}

function demoSyncRuns() {
  return [
    {
      id: 'demo-sync-1',
      status: 'success',
      repos_synced: 8,
      commits_synced: 42,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-sync-2',
      status: 'success',
      repos_synced: 8,
      commits_synced: 31,
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];
}

function mapSyncHistoryRun(run) {
  const startedAt = firstValue(run.started_at, run.startedAt, run.created_at, run.createdAt);
  const completedAt = firstValue(
    run.finished_at,
    run.finishedAt,
    run.completed_at,
    run.completedAt,
    run.ended_at,
    run.endedAt
  );
  const errorMessage = firstValue(run.error_message, run.errorMessage, run.error, null);

  return {
    id: String(run.id),
    startedAt,
    completedAt,
    status: normalizeSyncHistoryStatus(run.status),
    durationSeconds: getDurationSeconds(run, startedAt, completedAt),
    repositoriesSynced: toNumber(
      firstValue(run.repos_synced, run.reposSynced, run.repositories_synced, run.repositoriesSynced, run.repositories),
      0
    ),
    commitsImported: toNumber(
      firstValue(run.commits_synced, run.commitsSynced, run.commits_imported, run.commitsImported, run.commits),
      0
    ),
    errorMessage: errorMessage || null
  };
}

function normalizeSyncHistoryStatus(status) {
  return String(status || '').toLowerCase() === 'failed' ? 'failed' : 'success';
}

function getDurationSeconds(run, startedAt, completedAt) {
  const configuredDuration = firstValue(run.duration_seconds, run.durationSeconds, run.duration);
  const configuredSeconds = toNumber(configuredDuration, null);
  if (configuredSeconds !== null) return configuredSeconds;

  if (!startedAt || !completedAt) return null;

  const start = new Date(startedAt);
  const finish = new Date(completedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) return null;

  return Math.max(0, Math.round((finish.getTime() - start.getTime()) / 1000));
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
