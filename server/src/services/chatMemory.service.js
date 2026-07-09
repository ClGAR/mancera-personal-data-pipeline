import { supabase } from '../config/supabase.js';

const backendSessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sessionSelectBase = 'id, title, created_at, updated_at';
const sessionSelectWithArchive = `${sessionSelectBase}, archived_at`;
const messageSelectBase = 'id, role, content, mode, source, metadata, created_at';
const messageSelectWithLiveData = `${messageSelectBase}, used_live_data`;

const defaultAssistantPreferences = {
  memoryEnabled: true,
  preferredTone: 'warm, calm, practical',
  preferredLanguageStyle: 'clear and beginner-friendly',
  preferredAnswerLength: 'concise',
  preferredExplanationLevel: 'practical'
};

const memoryTypeLabels = new Set(['preference', 'correction', 'project_context', 'personal_context', 'learning_goal']);

export function getChatMemoryUserId(user) {
  return user?.userId || user?.id || null;
}

export function canUseChatPersistence(user) {
  return Boolean(supabase && getChatMemoryUserId(user));
}

export function isBackendChatSessionId(sessionId) {
  return backendSessionIdPattern.test(String(sessionId || '').trim());
}

export function normalizeChatPersistenceError(error, operation = 'chat_persistence') {
  if (isChatPersistenceSchemaError(error)) {
    return {
      status: 503,
      code: 'database_schema_missing',
      message: 'Chat history tables are not ready. Run server/src/db/chat.sql in Supabase, then restart the backend.'
    };
  }

  if (operation === 'session_create') {
    return {
      status: 500,
      code: 'session_create_failed',
      message: 'Chat session could not be saved right now.'
    };
  }

  return {
    status: Number(error?.status || error?.statusCode || 500),
    code: 'chat_persistence_failed',
    message: 'Chat history is unavailable right now.'
  };
}

export function sanitizePersistenceLogMessage(message) {
  return String(message || '')
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted]');
}

export async function listChatSessions(user) {
  if (!canUseChatPersistence(user)) return [];

  let { data, error } = await supabase
    .from('chat_sessions')
    .select(sessionSelectWithArchive)
    .eq('user_id', getChatMemoryUserId(user))
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(25);

  if (error && isMissingColumnError(error, 'archived_at')) {
    ({ data, error } = await supabase
      .from('chat_sessions')
      .select(sessionSelectBase)
      .eq('user_id', getChatMemoryUserId(user))
      .order('updated_at', { ascending: false })
      .limit(25));
  }

  if (error) throw error;
  return (data || []).map(mapSession);
}

export async function createChatSession(user, title = 'New chat') {
  if (!canUseChatPersistence(user)) return null;

  await ensureChatProfile(user);

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: getChatMemoryUserId(user),
      title: title || 'New chat'
    })
    .select(sessionSelectBase)
    .single();

  if (error) throw error;
  return mapSession(data);
}

export async function deleteChatSession(user, sessionId) {
  if (!canUseChatPersistence(user) || !isBackendChatSessionId(sessionId)) return false;

  let { error } = await supabase
    .from('chat_sessions')
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('user_id', getChatMemoryUserId(user));

  if (error && isMissingColumnError(error, 'archived_at')) {
    ({ error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', getChatMemoryUserId(user)));
  }

  if (error) throw error;
  return true;
}

export async function getChatSessionMessages(user, sessionId) {
  if (!canUseChatPersistence(user) || !isBackendChatSessionId(sessionId)) return [];

  let { data, error } = await supabase
    .from('chat_messages')
    .select(messageSelectWithLiveData)
    .eq('user_id', getChatMemoryUserId(user))
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error && isMissingColumnError(error, 'used_live_data')) {
    ({ data, error } = await supabase
      .from('chat_messages')
      .select(messageSelectBase)
      .eq('user_id', getChatMemoryUserId(user))
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(200));
  }

  if (error) throw error;
  return (data || []).map(mapMessage);
}

export async function ensureChatSession(user, sessionId, question) {
  if (!canUseChatPersistence(user)) return null;
  if (!isBackendChatSessionId(sessionId)) return null;

  let { data, error } = await supabase
    .from('chat_sessions')
    .select(sessionSelectWithArchive)
    .eq('id', sessionId)
    .eq('user_id', getChatMemoryUserId(user))
    .is('archived_at', null)
    .maybeSingle();

  if (error && isMissingColumnError(error, 'archived_at')) {
    ({ data, error } = await supabase
      .from('chat_sessions')
      .select(sessionSelectBase)
      .eq('id', sessionId)
      .eq('user_id', getChatMemoryUserId(user))
      .maybeSingle());
  }

  if (error) throw error;
  return data ? mapSession(data) : null;
}

export async function saveChatMessage(user, sessionId, { role, content, mode = null, source = null, metadata = {} }) {
  if (!canUseChatPersistence(user) || !isBackendChatSessionId(sessionId) || !content) return null;

  await ensureChatProfile(user);

  const row = {
    session_id: sessionId,
    user_id: getChatMemoryUserId(user),
    role,
    content,
    mode,
    source,
    metadata,
    used_live_data: Boolean(metadata?.usedLiveData)
  };

  let { data, error } = await supabase
    .from('chat_messages')
    .insert(row)
    .select(messageSelectWithLiveData)
    .single();

  if (error && isMissingColumnError(error, 'used_live_data')) {
    const { used_live_data: _usedLiveData, ...legacyRow } = row;
    ({ data, error } = await supabase.from('chat_messages').insert(legacyRow).select(messageSelectBase).single());
  }

  if (error) throw error;

  await touchChatSession(user, sessionId, role === 'user' ? buildSessionTitle(content) : null);
  return mapMessage(data);
}

export async function buildChatMemoryContext(user, sessionId, memoryEnabledOverride) {
  if (!canUseChatPersistence(user)) {
    return {
      persistenceEnabled: false,
      memoryEnabled: false,
      preferences: defaultAssistantPreferences,
      memories: [],
      recentMessages: []
    };
  }

  const preferences = await getAssistantPreferences(user);
  const memoryEnabled = memoryEnabledOverride === false ? false : preferences.memoryEnabled !== false;
  const [memories, recentMessages] = await Promise.all([
    memoryEnabled ? listUserMemories(user) : Promise.resolve([]),
    sessionId ? getRecentChatMessages(user, sessionId) : Promise.resolve([])
  ]);

  return {
    persistenceEnabled: true,
    memoryEnabled,
    preferences,
    memories,
    recentMessages
  };
}

export async function getAssistantPreferences(user) {
  if (!canUseChatPersistence(user)) return defaultAssistantPreferences;

  const userId = getChatMemoryUserId(user);
  const { data, error } = await supabase
    .from('assistant_preferences')
    .select('user_id, memory_enabled, preferred_tone, preferred_language_style, preferred_answer_length, preferred_explanation_level')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapPreferences(data);

  await ensureChatProfile(user);

  const { data: inserted, error: insertError } = await supabase
    .from('assistant_preferences')
    .insert({
      user_id: userId,
      memory_enabled: defaultAssistantPreferences.memoryEnabled,
      preferred_tone: defaultAssistantPreferences.preferredTone,
      preferred_language_style: defaultAssistantPreferences.preferredLanguageStyle,
      preferred_answer_length: defaultAssistantPreferences.preferredAnswerLength,
      preferred_explanation_level: defaultAssistantPreferences.preferredExplanationLevel
    })
    .select('user_id, memory_enabled, preferred_tone, preferred_language_style, preferred_answer_length, preferred_explanation_level')
    .single();

  if (insertError) throw insertError;
  return mapPreferences(inserted);
}

export async function updateAssistantPreferences(user, updates) {
  if (!canUseChatPersistence(user)) return defaultAssistantPreferences;

  const current = await getAssistantPreferences(user);
  const next = {
    memory_enabled: updates.memoryEnabled ?? current.memoryEnabled,
    preferred_tone: updates.preferredTone ?? current.preferredTone,
    preferred_language_style: updates.preferredLanguageStyle ?? current.preferredLanguageStyle,
    preferred_answer_length: updates.preferredAnswerLength ?? current.preferredAnswerLength,
    preferred_explanation_level: updates.preferredExplanationLevel ?? current.preferredExplanationLevel,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('assistant_preferences')
    .update(next)
    .eq('user_id', getChatMemoryUserId(user))
    .select('user_id, memory_enabled, preferred_tone, preferred_language_style, preferred_answer_length, preferred_explanation_level')
    .single();

  if (error) throw error;
  return mapPreferences(data);
}

export async function listUserMemories(user) {
  if (!canUseChatPersistence(user)) return [];

  const { data, error } = await supabase
    .from('user_memories')
    .select('id, memory_type, content, confidence, source_message_id, created_at, updated_at, is_active')
    .eq('user_id', getChatMemoryUserId(user))
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(80);

  if (error) throw error;
  return (data || []).map(mapMemory);
}

export async function createUserMemory(user, { memoryType = 'preference', content, confidence = 0.7, sourceMessageId = null }) {
  if (!canUseChatPersistence(user) || !content) return null;
  const cleanContent = normalizeMemoryContent(content);
  if (!cleanContent || isSensitiveMemoryContent(cleanContent)) return null;

  const type = memoryTypeLabels.has(memoryType) ? memoryType : 'preference';
  const userId = getChatMemoryUserId(user);
  await ensureChatProfile(user);

  const { data: existing, error: findError } = await supabase
    .from('user_memories')
    .select('id')
    .eq('user_id', userId)
    .eq('content', cleanContent)
    .eq('is_active', true)
    .maybeSingle();

  if (findError) throw findError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from('user_memories')
      .update({
        memory_type: type,
        confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select('id, memory_type, content, confidence, source_message_id, created_at, updated_at, is_active')
      .single();

    if (error) throw error;
    return mapMemory(data);
  }

  const { data, error } = await supabase
    .from('user_memories')
    .insert({
      user_id: userId,
      memory_type: type,
      content: cleanContent,
      confidence,
      source_message_id: sourceMessageId
    })
    .select('id, memory_type, content, confidence, source_message_id, created_at, updated_at, is_active')
    .single();

  if (error) throw error;
  return mapMemory(data);
}

export async function deleteUserMemory(user, memoryId) {
  if (!canUseChatPersistence(user) || !memoryId) return false;

  const { error } = await supabase
    .from('user_memories')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', memoryId)
    .eq('user_id', getChatMemoryUserId(user));

  if (error) throw error;
  return true;
}

export async function clearUserMemories(user) {
  if (!canUseChatPersistence(user)) return false;

  const { error } = await supabase
    .from('user_memories')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', getChatMemoryUserId(user))
    .eq('is_active', true);

  if (error) throw error;
  return true;
}

export async function extractAndStoreMemories(user, { userMessage, assistantAnswer, sourceMessageId, memoryContext }) {
  if (!canUseChatPersistence(user) || !memoryContext?.memoryEnabled) return [];

  const candidates = extractMemoryCandidates(userMessage, assistantAnswer);
  const saved = [];

  for (const candidate of candidates) {
    const memory = await createUserMemory(user, {
      ...candidate,
      sourceMessageId
    });
    if (memory) saved.push(memory);
  }

  return saved;
}

export function formatMemoryContextForPrompt(memoryContext) {
  if (!memoryContext?.memoryEnabled) return 'Memory is off.';

  const parts = [];
  const preferences = memoryContext.preferences || defaultAssistantPreferences;
  parts.push(
    `Tone: ${preferences.preferredTone}. Style: ${preferences.preferredLanguageStyle}. Answer length: ${preferences.preferredAnswerLength}. Explanation level: ${preferences.preferredExplanationLevel}.`
  );

  if (memoryContext.memories?.length) {
    parts.push('Saved memories:');
    parts.push(...memoryContext.memories.slice(0, 12).map((memory) => `- ${memory.memoryType}: ${memory.content}`));
  }

  if (memoryContext.recentMessages?.length) {
    parts.push('Recent conversation:');
    parts.push(
      ...memoryContext.recentMessages
        .slice(-10)
        .map((message) => `- ${message.role === 'assistant' ? 'assistant' : 'user'}: ${message.content}`)
    );
  }

  return parts.join('\n');
}

export function hasLongTermMemory(memoryContext) {
  return Boolean(memoryContext?.memoryEnabled && memoryContext?.memories?.length);
}

function extractMemoryCandidates(userMessage, assistantAnswer) {
  const text = String(userMessage || '').trim();
  const normalized = text.toLowerCase();
  const candidates = [];

  const rememberMatch = text.match(/\bremember that\s+(.+)/i) || text.match(/\bplease remember\s+(.+)/i);
  if (rememberMatch?.[1]) {
    candidates.push({
      memoryType: inferMemoryType(rememberMatch[1]),
      content: rememberMatch[1],
      confidence: 0.9
    });
  }

  const correctionMatch =
    text.match(/\b(?:i thought|actually|correction[:,]?)\s+(.+?)\s+means\s+(.+)/i) ||
    text.match(/\b([A-Z][A-Z0-9]{1,8})\s+means\s+(.+)/);
  if (correctionMatch) {
    const content = correctionMatch[0].replace(/^actually\s+/i, '').replace(/^correction[:,]?\s*/i, '');
    candidates.push({
      memoryType: 'correction',
      content,
      confidence: 0.86
    });
  }

  if (/\bi prefer\b|\bmy preference is\b|\bplease keep answers\b|\bkeep answers\b/.test(normalized)) {
    candidates.push({
      memoryType: 'preference',
      content: text,
      confidence: 0.78
    });
  }

  if (/\bi(?:'m| am) building\b|\bmy project\b|\bportfolio project\b/.test(normalized)) {
    candidates.push({
      memoryType: 'project_context',
      content: text,
      confidence: 0.74
    });
  }

  if (/\bi want to learn\b|\bmy goal is\b|\blearning goal\b/.test(normalized)) {
    candidates.push({
      memoryType: 'learning_goal',
      content: text,
      confidence: 0.72
    });
  }

  if (normalized.includes('ghl') && normalized.includes('gohighlevel')) {
    candidates.push({
      memoryType: 'correction',
      content: 'GHL means GoHighLevel in the user AI automation context.',
      confidence: 0.95
    });
  }

  return dedupeCandidates(candidates).filter((candidate) => {
    const content = normalizeMemoryContent(candidate.content);
    return content && !isSensitiveMemoryContent(content) && !isOneOffQuestion(content, assistantAnswer);
  });
}

function inferMemoryType(content) {
  const normalized = String(content || '').toLowerCase();
  if (normalized.includes('means') || normalized.includes('correction')) return 'correction';
  if (normalized.includes('prefer') || normalized.includes('style') || normalized.includes('tone')) return 'preference';
  if (normalized.includes('project') || normalized.includes('portfolio')) return 'project_context';
  if (normalized.includes('learn') || normalized.includes('goal')) return 'learning_goal';
  return 'personal_context';
}

function normalizeMemoryContent(content) {
  return String(content || '').replace(/\s+/g, ' ').trim().slice(0, 600);
}

function isSensitiveMemoryContent(content) {
  const normalized = String(content || '').toLowerCase();
  const secretPatterns = [
    /\b(api[_\s-]?key|secret|password|token|private key|service role|oauth secret|client secret)\b/i,
    /\b(supabase|github|n8n).*(key|secret|token|webhook)\b/i,
    /\bsk-[a-z0-9_-]{12,}/i,
    /\bgh[pousr]_[a-z0-9_]{20,}/i,
    /\bsb_(secret|publishable)_[a-z0-9_-]+/i,
    /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/
  ];

  return secretPatterns.some((pattern) => pattern.test(content)) || (normalized.includes('webhook') && normalized.includes('http'));
}

function isOneOffQuestion(content) {
  const normalized = String(content || '').toLowerCase();
  return normalized.endsWith('?') && !normalized.includes('remember') && !normalized.includes('prefer');
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const content = normalizeMemoryContent(candidate.content).toLowerCase();
    if (!content || seen.has(content)) return false;
    seen.add(content);
    return true;
  });
}

async function ensureChatProfile(user) {
  if (!canUseChatPersistence(user)) return null;

  const userId = getChatMemoryUserId(user);
  const row = {
    user_id: userId
  };
  const githubId = user?.githubId || user?.github_id;
  const username = user?.username || user?.login;
  const displayName = user?.displayName || user?.display_name || user?.name;
  const avatarUrl = user?.avatarUrl || user?.avatar_url;

  if (githubId) row.github_id = String(githubId);
  if (username) row.username = String(username);
  if (displayName) row.display_name = String(displayName);
  if (avatarUrl) row.avatar_url = String(avatarUrl);

  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;

  return row;
}

async function getRecentChatMessages(user, sessionId) {
  const messages = await getChatSessionMessages(user, sessionId);
  return messages.slice(-16);
}

async function touchChatSession(user, sessionId, title) {
  const update = { updated_at: new Date().toISOString() };
  if (title) update.title = title;

  const { error } = await supabase
    .from('chat_sessions')
    .update(update)
    .eq('id', sessionId)
    .eq('user_id', getChatMemoryUserId(user));

  if (error) throw error;
}

function buildSessionTitle(question) {
  const title = String(question || 'New chat').replace(/\s+/g, ' ').trim();
  if (!title) return 'New chat';
  return title.length > 54 ? `${title.slice(0, 51)}...` : title;
}

function isChatPersistenceSchemaError(error) {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || error?.details || error?.hint || '').toLowerCase();

  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST200' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    message.includes('schema cache') ||
    message.includes('could not find the table') ||
    message.includes('could not find the') ||
    message.includes('relation "chat_') ||
    message.includes("relation 'chat_") ||
    message.includes('column "archived_at"') ||
    message.includes('column "used_live_data"')
  );
}

function isMissingColumnError(error, columnName) {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || error?.details || error?.hint || '').toLowerCase();
  const column = String(columnName || '').toLowerCase();

  return (
    (code === '42703' || code === 'PGRST204' || message.includes('schema cache') || message.includes('could not find the')) &&
    message.includes(column)
  );
}

function mapSession(row) {
  return {
    id: row.id,
    title: row.title || 'New chat',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
    localOnly: false
  };
}

function mapMessage(row) {
  const metadata = row.metadata || {};

  return {
    id: row.id,
    role: row.role,
    content: row.content,
    mode: row.mode,
    source: row.source,
    metadata: {
      ...metadata,
      usedLiveData: metadata.usedLiveData ?? row.used_live_data ?? false
    },
    usedLiveData: row.used_live_data ?? metadata.usedLiveData ?? false,
    createdAt: row.created_at
  };
}

function mapMemory(row) {
  return {
    id: row.id,
    memoryType: row.memory_type,
    content: row.content,
    confidence: row.confidence,
    sourceMessageId: row.source_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActive: row.is_active
  };
}

function mapPreferences(row) {
  return {
    memoryEnabled: row.memory_enabled !== false,
    preferredTone: row.preferred_tone || defaultAssistantPreferences.preferredTone,
    preferredLanguageStyle: row.preferred_language_style || defaultAssistantPreferences.preferredLanguageStyle,
    preferredAnswerLength: row.preferred_answer_length || defaultAssistantPreferences.preferredAnswerLength,
    preferredExplanationLevel: row.preferred_explanation_level || defaultAssistantPreferences.preferredExplanationLevel
  };
}
