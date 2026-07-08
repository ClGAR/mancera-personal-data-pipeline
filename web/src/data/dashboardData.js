import {
  dailyCommitActivity as mockDailyCommitActivity,
  dayBreakdown as mockDayBreakdown,
  integrationCards as mockIntegrationCards,
  overviewActivity as mockOverviewActivity,
  overviewIntegrations as mockOverviewIntegrations,
  overviewRepos as mockOverviewRepos,
  overviewStats as mockOverviewStats,
  overviewSyncJobs as mockOverviewSyncJobs,
  repositories as mockRepositories,
  syncHistory as mockSyncHistory,
  topRepoHighlights as mockTopRepoHighlights,
  weeklyStats as mockWeeklyStats
} from './mockData.js';

const repoTypes = ['site', 'database', 'terminal', 'notes', 'supabase', 'docs', 'app'];
const languages = ['TypeScript', 'JavaScript', 'Python', 'Markdown'];

export function buildDashboardData({ weekly, topRepos, syncHistory, syncRuns, syncError, health, auth } = {}) {
  const weeklyData = buildWeeklyData(weekly);
  const repoData = buildTopReposData(topRepos);
  const syncData = buildSyncData(syncHistory ?? syncRuns, syncError);
  const integrationData = buildIntegrationData(health, auth);

  return {
    weekly: weeklyData,
    topRepos: repoData,
    sync: syncData,
    integrations: integrationData,
    usingMockData: weeklyData.source === 'mock' || repoData.source === 'mock' || syncData.source === 'mock'
  };
}

export function getInitialDashboardData() {
  return buildDashboardData();
}

function buildWeeklyData(apiWeekly) {
  if (!hasUsefulWeeklyData(apiWeekly)) {
    return {
      source: 'mock',
      overviewStats: mockOverviewStats,
      overviewActivity: mockOverviewActivity,
      weeklyStats: mockWeeklyStats,
      dailyCommitActivity: mockDailyCommitActivity,
      dayBreakdown: mockDayBreakdown,
      insights: {
        bestDay: 'Wednesday, May 14',
        bestDayCommits: '32 commits',
        growth: '+18%',
        growthDetail: 'vs May 4 - May 11',
        peakWindow: '10:00 AM - 2:00 PM',
        highlight: 'You had 23 more commits this week compared to the previous 7-day period.'
      }
    };
  }

  const cards = apiWeekly.cards || {};
  const chart = normalizeWeeklyChart(apiWeekly.chart);
  const values = chart.map((item) => item.value);
  const weeklyCommits = toNumber(cards.weeklyCommits ?? cards.totalCommits, sum(values));
  const activeRepositories = toNumber(cards.activeRepositories ?? cards.repositories, 0);
  const currentStreak = toNumber(cards.currentStreak ?? cards.streak, 0);
  const lastSync = apiWeekly.lastSync || {};
  const lastSyncStatus = String(cards.lastSyncStatus || lastSync.status || 'not synced');
  const lastSyncTime = formatDateTime(lastSync.finished_at || lastSync.finishedAt || lastSync.created_at || lastSync.createdAt);
  const bestDay = chart.reduce((best, item) => (item.value > best.value ? item : best), chart[0]);
  const avg = chart.length ? weeklyCommits / chart.length : 0;

  return {
    source: 'api',
    overviewStats: [
      {
        label: 'Weekly Commits',
        value: formatNumber(weeklyCommits),
        change: 'From connected GitHub data',
        tone: 'primary',
        trendTone: 'success',
        sparkline: values
      },
      {
        label: 'Active Repositories',
        value: formatNumber(activeRepositories),
        change: 'Synced repositories',
        tone: 'success',
        trendTone: 'success',
        sparkline: values.map((value, index) => Math.max(1, Math.round(value / 2) + index))
      },
      {
        label: 'Current Streak',
        value: `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`,
        change: currentStreak > 0 ? 'Keep it up!' : 'No current streak yet',
        tone: 'highlight',
        trendTone: currentStreak > 0 ? 'highlight' : 'muted',
        sparkline: values
      },
      {
        label: 'Last Sync Status',
        value: toTitleCase(lastSyncStatus),
        change: lastSyncTime || 'Run Sync Now to refresh',
        tone: 'status',
        trendTone: 'muted'
      }
    ],
    overviewActivity: chart,
    weeklyStats: [
      {
        label: 'Total Commits',
        value: formatNumber(weeklyCommits),
        change: 'Last 7 days',
        tone: 'primary',
        trendTone: 'success',
        sparkline: values
      },
      {
        label: 'Best Day',
        value: formatNumber(bestDay.value),
        change: bestDay.fullLabel || bestDay.label,
        tone: 'success',
        trendTone: 'muted',
        sparkline: values
      },
      {
        label: 'Avg Commits/Day',
        value: avg.toFixed(1),
        change: '7-day average',
        tone: 'highlight',
        trendTone: 'muted',
        sparkline: values
      },
      {
        label: 'Current Streak',
        value: `${currentStreak}d`,
        change: lastSyncStatus === 'success' ? 'Latest sync succeeded' : `Latest sync: ${lastSyncStatus}`,
        tone: 'status',
        trendTone: 'muted',
        sparkline: values
      }
    ],
    dailyCommitActivity: chart,
    dayBreakdown: buildDayBreakdown(chart),
    insights: {
      bestDay: bestDay.fullLabel || bestDay.label,
      bestDayCommits: `${bestDay.value} ${bestDay.value === 1 ? 'commit' : 'commits'}`,
      growth: 'Live data',
      growthDetail: 'From the connected backend',
      peakWindow: 'Available after richer commit metadata',
      highlight: `Your connected data shows ${weeklyCommits} commits across the latest ${chart.length}-day window.`
    }
  };
}

function hasUsefulWeeklyData(apiWeekly) {
  if (!apiWeekly || typeof apiWeekly !== 'object') return false;

  const cards = apiWeekly.cards || {};
  const chart = Array.isArray(apiWeekly.chart) ? apiWeekly.chart : [];
  const chartTotal = chart.reduce((total, item) => total + toNumber(item.commits ?? item.value, 0), 0);
  const cardTotal = toNumber(cards.weeklyCommits ?? cards.totalCommits, 0);
  const activeRepositories = toNumber(cards.activeRepositories ?? cards.repositories, 0);

  return chartTotal > 0 || cardTotal > 0 || activeRepositories > 0 || Boolean(apiWeekly.lastSync);
}

function normalizeWeeklyChart(chart) {
  const normalized = (Array.isArray(chart) ? chart : [])
    .map((item) => {
      const label = String(item.label || item.day || item.date || '').trim();
      const value = toNumber(item.value ?? item.commits ?? item.count, 0);
      const dateLabel = item.date ? formatShortDate(item.date) : '';

      return {
        label: dateLabel || label || 'Day',
        subLabel: item.subLabel || item.weekday || '',
        fullLabel: dateLabel && label ? `${dateLabel} (${label})` : dateLabel || label,
        value
      };
    })
    .filter((item) => item.label);

  return normalized.length ? normalized : mockDailyCommitActivity;
}

function buildDayBreakdown(chart) {
  return chart.map((item, index) => {
    const previousValue = index > 0 ? chart[index - 1].value : null;
    const diff = previousValue === null ? null : item.value - previousValue;
    const percent = previousValue ? ` (${((diff / previousValue) * 100).toFixed(1)}%)` : '';
    const trend = chart.slice(Math.max(0, index - 8), index + 1).map((entry) => entry.value);

    return {
      day: item.subLabel || item.label,
      date: item.fullLabel || item.label,
      commits: item.value,
      previous: diff === null ? '-' : `${diff >= 0 ? '+' : ''}${diff}${percent}`,
      status: diff === null ? 'flat' : diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
      trend
    };
  });
}

function buildTopReposData(apiRepos) {
  if (!Array.isArray(apiRepos) || apiRepos.length === 0) {
    return {
      source: 'mock',
      repositories: mockRepositories,
      overviewRepos: mockOverviewRepos,
      highlights: mockTopRepoHighlights
    };
  }

  const repositories = apiRepos
    .map((repo, index) => {
      const name = repo.fullName || repo.full_name || repo.repoName || repo.name || repo.repository || `Repository ${index + 1}`;
      const commits = toNumber(repo.commits ?? repo.commits30d ?? repo.commitCount ?? repo.commit_count, 0);
      const language = repo.language || languages[index % languages.length];

      return {
        id: repo.id || name,
        rank: toNumber(repo.rank, index + 1),
        name,
        type: getRepoType(name, language, index),
        language,
        commits,
        htmlUrl: repo.htmlUrl || repo.html_url || repo.url || '',
        lastActivity: formatDate(repo.lastCommitAt || repo.last_commit_at || repo.lastActivity || repo.pushed_at),
        visibility: repo.visibility || (repo.private ? 'Private' : 'Public'),
        trend: normalizeTrend(repo.trend, commits)
      };
    })
    .filter((repo) => repo.commits > 0)
    .sort((a, b) => b.commits - a.commits)
    .map((repo, index) => ({ ...repo, rank: index + 1 }));

  if (repositories.length === 0) {
    return {
      source: 'mock',
      repositories: mockRepositories,
      overviewRepos: mockOverviewRepos,
      highlights: mockTopRepoHighlights
    };
  }

  const topRepo = repositories[0];
  const fastestRepo = repositories[1] || topRepo;

  return {
    source: 'api',
    repositories,
    overviewRepos: repositories.slice(0, 5),
    highlights: [
      {
        title: 'Most Active Repo',
        repo: topRepo.name,
        value: `${topRepo.commits} commits`,
        change: 'From synced GitHub data',
        tone: 'primary',
        trend: topRepo.trend
      },
      {
        title: 'Runner-up Repo',
        repo: fastestRepo.name,
        value: `${fastestRepo.commits} commits`,
        change: 'next most active',
        tone: 'success',
        trend: fastestRepo.trend
      }
    ]
  };
}

function buildSyncData(apiRuns, syncError = '') {
  const runs = Array.isArray(apiRuns?.items) ? apiRuns.items : Array.isArray(apiRuns) ? apiRuns : [];

  if (runs.length === 0) {
    return {
      source: 'mock',
      history: mockSyncHistory,
      overviewJobs: mockOverviewSyncJobs,
      errorMessage: syncError,
      emptyMessage: syncError ? '' : 'No real sync history found yet. Demo sync runs are shown until the first sync is recorded.'
    };
  }

  const history = runs.map((run, index) => {
    const startedAt = run.startedAt || run.started_at || run.created_at || run.createdAt;
    const finishedAt = run.completedAt || run.completed_at || run.finished_at || run.finishedAt;
    const status = run.status || 'unknown';
    const sortTime = getTimestamp(startedAt || finishedAt);
    const errorMessage = run.errorMessage || run.error_message || run.error || '';

    return {
      id: run.id || `sync-${index}`,
      time: formatDateTime(startedAt) || 'Unknown time',
      relative: formatRelative(startedAt),
      status,
      duration: formatDurationLabel(run.durationSeconds ?? run.duration_seconds, startedAt, finishedAt),
      repositories: toNumber(
        run.repositoriesSynced ?? run.repositories_synced ?? run.repos_synced ?? run.reposSynced ?? run.repositories,
        0
      ),
      commits: toNumber(run.commitsImported ?? run.commits_imported ?? run.commits_synced ?? run.commitsSynced ?? run.commits, 0),
      error: status === 'failed' ? errorMessage || 'No error message recorded' : '-',
      startedAt,
      completedAt: finishedAt,
      sortTime
    };
  }).sort((a, b) => b.sortTime - a.sortTime);

  return {
    source: 'api',
    history,
    overviewJobs: history.slice(0, 5).map((run, index) => ({
      id: run.id,
      time: run.relative || run.time,
      status: run.status,
      duration: run.duration,
      isLatestSuccess: index === 0 && run.status === 'success'
    }))
  };
}

function buildIntegrationData(health, auth) {
  const integrations = health?.integrations;
  if (!integrations) {
    return {
      source: 'mock',
      overview: mockOverviewIntegrations,
      cards: mockIntegrationCards
    };
  }

  const authenticated = Boolean(auth?.authenticated);
  const username = auth?.user?.username || auth?.user?.displayName || '-';
  const aiProvider = String(integrations.aiProvider || health?.aiProvider || (integrations.ollama ? 'ollama' : 'anthropic')).toLowerCase();
  const aiModel = health?.ai?.ollamaModel || health?.ollamaModel || 'llama3.2';
  const isOllama = aiProvider === 'ollama';
  const aiConfigured = isOllama ? Boolean(integrations.ollama) : Boolean(integrations.anthropic);
  const aiName = isOllama ? 'Ollama Local AI' : 'Anthropic Claude';
  const aiProviderLabel = isOllama ? 'Ollama' : 'Anthropic';
  const overview = [
    { name: 'Supabase', status: statusLabel(integrations.supabase), type: 'supabase' },
    { name: 'GitHub', status: statusLabel(authenticated || integrations.githubOauth), type: 'github' },
    { name: 'n8n Webhook', status: statusLabel(integrations.n8nWebhook), type: 'webhook' },
    { name: aiName, status: statusLabel(aiConfigured), type: 'ai' }
  ];

  const cards = mockIntegrationCards.map((card) => {
    if (card.type === 'github') {
      return {
        ...card,
        status: statusLabel(authenticated || integrations.githubOauth),
        details: [
          ['Connected as', authenticated ? username : '-'],
          ['OAuth configured', statusLabel(integrations.githubOauth)]
        ]
      };
    }

    if (card.type === 'supabase') {
      return {
        ...card,
        status: statusLabel(integrations.supabase),
        details: [
          ['Backend status', statusLabel(integrations.supabase)],
          ['Client keys exposed', 'No']
        ]
      };
    }

    if (card.type === 'webhook') {
      return {
        ...card,
        status: statusLabel(integrations.n8nWebhook),
        details: [
          ['Webhook configured', statusLabel(integrations.n8nWebhook)],
          ['Last delivery', '-']
        ]
      };
    }

    if (card.type === 'ai') {
      return {
        ...card,
        title: aiName,
        status: statusLabel(aiConfigured),
        details: [
          ['Provider', aiProviderLabel],
          ['Model', isOllama ? aiModel : '-'],
          ['Configured', statusLabel(aiConfigured)]
        ]
      };
    }

    return card;
  });

  return {
    source: 'api',
    overview,
    cards,
    aiProvider,
    aiModel
  };
}

function normalizeTrend(trend, commits) {
  if (Array.isArray(trend) && trend.length > 0) {
    return trend.map((value) => toNumber(value, 0));
  }

  const base = Math.max(1, Math.round(toNumber(commits, 0) / 6));
  return [base, base + 1, base + 2, base + 1, base + 3, base + 4, base + 2, base + 5, base + 4, base + 6, base + 5];
}

function getRepoType(name, language, index) {
  const lowerName = String(name).toLowerCase();
  if (lowerName.includes('supabase')) return 'supabase';
  if (lowerName.includes('api') || lowerName.includes('data')) return 'database';
  if (lowerName.includes('cli')) return 'terminal';
  if (lowerName.includes('note') || language === 'Markdown') return 'notes';
  return repoTypes[index % repoTypes.length];
}

function statusLabel(value) {
  return value ? 'Connected' : 'Not Configured';
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sum(values) {
  return values.reduce((total, value) => total + toNumber(value, 0), 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(toNumber(value, 0));
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatRelative(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return '-';
  const start = new Date(startedAt);
  const finish = new Date(finishedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) return '-';
  const seconds = Math.max(0, Math.round((finish.getTime() - start.getTime()) / 1000));
  return `${seconds}s`;
}

function formatDurationLabel(durationSeconds, startedAt, finishedAt) {
  const seconds = toNumber(durationSeconds, null);
  if (seconds !== null) return `${seconds}s`;

  return formatDuration(startedAt, finishedAt);
}

function getTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function toTitleCase(value) {
  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
