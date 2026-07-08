import axios from 'axios';
import { supabase } from '../config/supabase.js';

const githubApi = (accessToken) =>
  axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'personal-data-pipeline'
    }
  });

export async function upsertGitHubUser({ profile, accessToken }) {
  const userId = `github:${profile.id}`;
  const username = profile.username || profile._json?.login;
  const displayName = profile.displayName || username;
  const email = profile.emails?.[0]?.value || profile._json?.email || null;
  const avatarUrl = profile.photos?.[0]?.value || profile._json?.avatar_url || null;

  if (!supabase) {
    return {
      id: userId,
      userId,
      githubId: String(profile.id),
      username,
      displayName,
      email,
      avatarUrl,
      githubAccessToken: accessToken,
      isDemo: false
    };
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      user_id: userId,
      github_id: String(profile.id),
      username,
      display_name: displayName,
      avatar_url: avatarUrl
    },
    { onConflict: 'user_id' }
  );

  if (profileError) throw profileError;

  const { error: accountError } = await supabase.from('github_accounts').upsert(
    {
      user_id: userId,
      github_id: String(profile.id),
      username,
      access_token: accessToken,
      scope: 'read:user repo',
      avatar_url: avatarUrl
    },
    { onConflict: 'github_id' }
  );

  if (accountError) throw accountError;

  return {
    id: userId,
    userId,
    githubId: String(profile.id),
    username,
    displayName,
    email,
    avatarUrl,
    githubAccessToken: accessToken,
    isDemo: false
  };
}

export async function fetchUserRepositories(accessToken) {
  if (!accessToken) return [];

  const client = githubApi(accessToken);
  const { data } = await client.get('/user/repos', {
    params: {
      per_page: 100,
      sort: 'updated',
      affiliation: 'owner,collaborator'
    }
  });

  return data;
}

export async function fetchRepositoryCommits(accessToken, fullName, sinceIso) {
  if (!accessToken || !fullName) return [];

  const client = githubApi(accessToken);
  const { data } = await client.get(`/repos/${fullName}/commits`, {
    params: {
      per_page: 50,
      since: sinceIso
    }
  });

  return data;
}

export async function getStoredGitHubAccounts() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('github_accounts')
    .select('user_id, github_id, username, access_token, avatar_url')
    .not('access_token', 'is', null);

  if (error) throw error;

  return data || [];
}
