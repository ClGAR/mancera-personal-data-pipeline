import { supabase } from '../config/supabase.js';
import { fetchRepositoryCommits, fetchUserRepositories } from './github.service.js';
import { notifyN8nSyncComplete } from './n8n.service.js';

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export async function syncUserGitHubActivity(user) {
  const userId = user.userId || user.user_id || user.id;
  const accessToken = user.githubAccessToken || user.access_token;

  if (!supabase || !accessToken) {
    return createDemoSyncResult(userId, !supabase ? 'Supabase is not configured' : 'GitHub access token is missing');
  }

  const syncRun = await createSyncRun(userId);

  try {
    const result = await performSync({ userId, accessToken });
    const finishedRun = await finishSyncRun(syncRun?.id, {
      status: 'success',
      reposSynced: result.reposSynced,
      commitsSynced: result.commitsSynced
    });

    const n8n = await notifyN8nSyncComplete({
      userId,
      status: 'success',
      reposSynced: result.reposSynced,
      commitsSynced: result.commitsSynced,
      syncedAt: new Date().toISOString()
    });
    const warnings = n8n.warning ? [n8n.warning] : [];

    return {
      success: true,
      status: 'success',
      message: 'Sync completed',
      warnings,
      syncRun: finishedRun,
      n8n,
      ...result
    };
  } catch (error) {
    await finishSyncRun(syncRun?.id, {
      status: 'failed',
      errorMessage: error.message
    });
    throw error;
  }
}

export async function syncGitHubAccount(account) {
  return syncUserGitHubActivity({
    id: account.user_id,
    userId: account.user_id,
    githubId: account.github_id,
    username: account.username,
    avatarUrl: account.avatar_url,
    githubAccessToken: account.access_token
  });
}

async function performSync({ userId, accessToken }) {
  const sinceIso = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const repositories = await fetchUserRepositories(accessToken);
  const reposToSync = repositories.slice(0, 20);

  const repoRows = reposToSync.map((repo) => ({
    user_id: userId,
    github_id: String(repo.id),
    repo_name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    html_url: repo.html_url,
    default_branch: repo.default_branch,
    pushed_at: repo.pushed_at
  }));

  const { data: savedRepos, error: repoError } = await supabase
    .from('repositories')
    .upsert(repoRows, { onConflict: 'github_id' })
    .select('id, github_id, repo_name, full_name');

  if (repoError) throw repoError;

  const repoByFullName = new Map((savedRepos || []).map((repo) => [repo.full_name, repo]));
  const commitRows = [];

  for (const repo of reposToSync) {
    const savedRepo = repoByFullName.get(repo.full_name);
    const commits = await fetchRepositoryCommits(accessToken, repo.full_name, sinceIso);

    for (const commit of commits) {
      commitRows.push({
        user_id: userId,
        repo_id: savedRepo?.id || null,
        repo_name: repo.name,
        commit_sha: commit.sha,
        commit_message: commit.commit?.message || '',
        author_name: commit.commit?.author?.name || null,
        committed_at: commit.commit?.author?.date || commit.commit?.committer?.date || null
      });
    }
  }

  if (commitRows.length > 0) {
    const { error: commitError } = await supabase
      .from('commits')
      .upsert(commitRows, { onConflict: 'commit_sha' });

    if (commitError) throw commitError;
  }

  return {
    reposSynced: repoRows.length,
    commitsSynced: commitRows.length
  };
}

async function createSyncRun(userId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sync_runs')
    .insert({
      user_id: userId,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function finishSyncRun(syncRunId, { status, reposSynced = 0, commitsSynced = 0, errorMessage = null }) {
  if (!supabase || !syncRunId) return null;

  const { data, error } = await supabase
    .from('sync_runs')
    .update({
      status,
      repos_synced: reposSynced,
      commits_synced: commitsSynced,
      error_message: errorMessage,
      finished_at: new Date().toISOString()
    })
    .eq('id', syncRunId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

function createDemoSyncResult(userId, reason) {
  return {
    success: true,
    status: 'demo',
    userId,
    reposSynced: 4,
    commitsSynced: 42,
    warnings: [],
    n8n: {
      delivered: false,
      reason: 'Skipped in demo mode'
    },
    message: `${reason}. Returning a realistic demo sync response instead.`
  };
}
