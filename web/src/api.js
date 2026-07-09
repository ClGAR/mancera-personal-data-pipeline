export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const { body, headers, ...restOptions } = options;
  const hasBody = body !== undefined && body !== null;
  const requestBody = hasBody && typeof body !== 'string' ? JSON.stringify(body) : body;
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...restOptions,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {})
      },
      ...(hasBody ? { body: requestBody } : {})
    });
  } catch {
    const error = new Error('Backend offline. Start the API server and try again.');
    error.status = 0;
    error.code = 'BACKEND_OFFLINE';
    throw error;
  }

  const responseText = await response.text();
  const data = responseText ? parseJson(responseText) : null;

  if (!response.ok) {
    const message = getSafeErrorMessage(data, response.status);
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function getSafeErrorMessage(data, status) {
  if (data?.error === 'auth_required') return data?.message || 'Please connect GitHub first.';
  if (data?.error === 'database_schema_missing') return data?.message || 'Backend chat history is not set up yet.';
  if (data?.error === 'session_create_failed') return data?.message || 'Chat session could not be saved right now.';
  if (data?.error === 'chat_persistence_failed') return data?.message || 'Chat history is unavailable right now.';
  if (status === 401) return data?.message || 'Please connect GitHub first.';
  if (status === 503) return data?.message || 'A required service is not configured.';
  if (status >= 500) return 'The backend hit an internal error. Please try again.';

  return data?.message || data?.error || `Request failed with status ${status}`;
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

export function getSyncHistory() {
  return request('/stats/sync-history');
}

export function runManualSync() {
  return request('/stats/sync', {
    method: 'POST'
  });
}

export function askChatbot(question, mode = 'auto', options = {}) {
  return request('/chatbot/ask', {
    method: 'POST',
    body: {
      question,
      mode,
      sessionId: options.sessionId,
      memoryEnabled: options.memoryEnabled
    }
  });
}

export function getChatSessions() {
  return request('/chatbot/sessions');
}

export function createChatSession(title = 'New chat') {
  return request('/chatbot/sessions', {
    method: 'POST',
    body: { title }
  });
}

export function getChatSessionMessages(sessionId) {
  return request(`/chatbot/sessions/${sessionId}/messages`);
}

export function deleteChatSession(sessionId) {
  return request(`/chatbot/sessions/${sessionId}`, {
    method: 'DELETE'
  });
}

export function getChatMemories() {
  return request('/chatbot/memories');
}

export function createChatMemory(content, memoryType = 'preference') {
  return request('/chatbot/memories', {
    method: 'POST',
    body: { content, memoryType }
  });
}

export function deleteChatMemory(memoryId) {
  return request(`/chatbot/memories/${memoryId}`, {
    method: 'DELETE'
  });
}

export function clearChatMemories() {
  return request('/chatbot/memories', {
    method: 'DELETE'
  });
}

export function updateAssistantPreferences(updates) {
  return request('/chatbot/preferences', {
    method: 'PATCH',
    body: updates
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
  getSyncHistory,
  runManualSync,
  syncNow: runManualSync,
  askChatbot,
  getChatSessions,
  createChatSession,
  getChatSessionMessages,
  deleteChatSession,
  getChatMemories,
  createChatMemory,
  deleteChatMemory,
  clearChatMemories,
  updateAssistantPreferences,
  getHealth,
  loginWithGitHub
};
