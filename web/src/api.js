export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const { body, headers, ...restOptions } = options;
  const hasBody = body !== undefined && body !== null;
  const requestBody = hasBody && typeof body !== 'string' ? JSON.stringify(body) : body;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {})
    },
    ...(hasBody ? { body: requestBody } : {})
  });

  const responseText = await response.text();
  const data = responseText ? parseJson(responseText) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return { message: value };
  }
}

export function getCurrentUser() {
  return request('/auth/me');
}

export function logout() {
  return request('/auth/logout', {
    method: 'POST'
  });
}

export function getWeeklyStats() {
  return request('/stats/weekly');
}

export function getTopRepos() {
  return request('/stats/top-repos');
}

export function getSyncRuns() {
  return request('/sync/runs');
}

export function runManualSync() {
  return request('/stats/sync', {
    method: 'POST'
  });
}

export function askChatbot(question) {
  return request('/chatbot/ask', {
    method: 'POST',
    body: { question }
  });
}

export function getHealth() {
  return request('/health');
}

export function loginWithGitHub() {
  window.location.href = `${API_BASE_URL}/auth/github`;
}

export const api = {
  getCurrentUser,
  getMe: getCurrentUser,
  logout,
  getWeeklyStats,
  getTopRepos,
  getSyncRuns,
  runManualSync,
  syncNow: runManualSync,
  askChatbot,
  getHealth,
  loginWithGitHub
};
