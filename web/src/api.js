const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `Request failed with ${response.status}`);
  }

  return response.json();
}

export const api = {
  getMe: () => request('/auth/me'),
  getWeeklyStats: () => request('/stats/weekly'),
  getTopRepos: () => request('/stats/top-repos'),
  getSyncRuns: () => request('/sync/runs'),
  syncNow: () =>
    request('/stats/sync', {
      method: 'POST'
    }),
  askChatbot: (question) =>
    request('/chatbot/ask', {
      method: 'POST',
      body: JSON.stringify({ question })
    }),
  loginWithGitHub: () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  }
};
