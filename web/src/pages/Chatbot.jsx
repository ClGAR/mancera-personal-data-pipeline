import {
  Calendar,
  Code2,
  Copy,
  Info,
  Lightbulb,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { askChatbot, createChatSession, deleteChatSession, getChatMemories, getChatSessionMessages, getChatSessions } from '../api.js';
import ChatMessageText from '../components/ChatMessageText.jsx';

const AUTO_MODE = 'auto';
const CHAT_HISTORY_KEY = 'personal-data-pipeline-chat-history-v2';
const LOCAL_CHAT_SESSIONS_KEY = 'personal-data-pipeline-local-chat-sessions-v1';
const CURRENT_SESSION_KEY = 'personal-data-pipeline-current-chat-session';
const LEGACY_CHAT_HISTORY_KEYS = ['personal-data-pipeline-chat-history', 'pdp:ai-assistant-history'];
const starterPrompts = [
  {
    prompt: 'Summarize my GitHub activity this week',
    Icon: TrendingUp
  },
  {
    prompt: 'Which repository had the most commits?',
    Icon: Calendar
  },
  {
    prompt: 'Explain OAuth 2.0 simply',
    Icon: Code2
  },
  {
    prompt: 'Help me improve this portfolio project',
    Icon: Sparkles
  },
  {
    prompt: 'What should I build next as a junior developer?',
    Icon: Star
  },
  {
    prompt: 'Explain Supabase RLS',
    Icon: Lightbulb
  }
];

function Chatbot({ auth, notify, chatResetNonce, onConnectGitHub }) {
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [messages, setMessages] = useState(readStoredMessages);
  const [sessions, setSessions] = useState([]);
  const [localSessions, setLocalSessions] = useState(readStoredLocalSessions);
  const [sessionId, setSessionId] = useState(() => readStoredValue(CURRENT_SESSION_KEY));
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [historyNotice, setHistoryNotice] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [sessionsRailOpen, setSessionsRailOpen] = useState(false);
  const threadRef = useRef(null);
  const composerRef = useRef(null);
  const greetingName = getGreetingName(auth?.user);
  const greeting = greetingName ? `Good to see you, ${greetingName}.` : 'Good to see you.';
  const visibleSessions = useMemo(() => {
    const fallbackSessions = localSessions.length ? localSessions : buildGuestSessions(messages);
    const combinedSessions = auth?.authenticated ? [...sessions, ...localSessions] : fallbackSessions;
    return filterSessions(combinedSessions, chatSearch);
  }, [auth?.authenticated, chatSearch, localSessions, messages, sessions]);

  useEffect(() => {
    if (chatResetNonce) {
      startNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatResetNonce]);

  useEffect(() => {
    if (!auth?.authenticated) saveStoredMessages(messages);
  }, [auth?.authenticated, messages]);

  useEffect(() => {
    saveStoredLocalSessions(localSessions);
  }, [localSessions]);

  useEffect(() => {
    if (!isLocalSessionId(sessionId)) return;

    setLocalSessions((current) => upsertLocalSessionMessages(current, sessionId, messages));
  }, [messages, sessionId]);

  useEffect(() => {
    if (auth?.loading) return;

    if (auth?.authenticated) {
      loadRemoteChatState(sessionId);
      return;
    }

    setSessions([]);
    setSessionId(null);
    setMessages(readStoredMessages());
    setMemoryEnabled(false);
    setHistoryNotice('');
    clearStoredValue(CURRENT_SESSION_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.authenticated, auth?.loading]);

  useEffect(() => {
    if (!messages.length || !threadRef.current) return;

    window.requestAnimationFrame(() => {
      const element = threadRef.current;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    });
  }, [messages]);

  async function sendQuestion(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || asking) return;

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const localSession = activateLocalSession(buildSessionTitle(cleanQuestion));
      activeSessionId = localSession.id;
    }

    const timestamp = getTimeLabel();
    const requestId = Date.now();
    setMessages((current) => [
      ...current,
      {
        id: `user-${requestId}`,
        role: 'user',
        time: timestamp,
        content: cleanQuestion,
        requestedMode: AUTO_MODE
      },
      {
        id: `ai-${requestId}`,
        role: 'ai',
        time: timestamp,
        content: 'Thinking through your question...',
        requestedMode: AUTO_MODE,
        loading: true
      }
    ]);
    setInput('');
    resetComposerHeight();
    setAsking(true);

    try {
      const result = await askChatbot(cleanQuestion, AUTO_MODE, {
        sessionId: isBackendSessionId(activeSessionId) ? activeSessionId : null,
        memoryEnabled
      });
      const answer = result?.answer || 'I found your data, but there was no answer text in the response.';
      if (result?.sessionId && result.sessionId !== sessionId) {
        setSessionId(result.sessionId);
        saveStoredValue(CURRENT_SESSION_KEY, result.sessionId);
      }
      setMessages((current) =>
        current.map((message) =>
          message.id === `ai-${requestId}`
            ? {
                ...message,
                content: answer,
                mode: result?.mode,
                source: result?.source,
                usedLiveData: result?.usedLiveData,
                warning: result?.warning,
                memoryUsed: result?.memoryUsed,
                loading: false
              }
            : message
        )
      );
      if (auth?.authenticated) refreshSessions();
      if (result?.source === 'supabase-fallback') {
        notify?.('Ollama was unavailable, so the answer used synced Supabase data.', 'warning', 'AI fallback used');
      } else if (result?.warning) {
        notify?.(result.warning, 'warning', 'AI notice');
      }
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === `ai-${requestId}`
            ? {
                ...message,
                content: error.message || 'Both AI and fallback response failed. Please check the backend.',
                loading: false,
                error: true
              }
            : message
        )
      );
      notify?.(error.message || 'Both AI and fallback response failed.', 'error', 'Chatbot error');
    } finally {
      setAsking(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(input);
  }

  function handleComposerChange(event) {
    setInput(event.target.value);
    resizeComposer(event.target);
  }

  function handleComposerKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    sendQuestion(input);
  }

  async function loadRemoteChatState(preferredSessionId) {
    setSessionsLoading(true);
    try {
      const [sessionsPayload, memoryPayload] = await Promise.all([getChatSessions(), getChatMemories()]);
      const remoteSessions = normalizeSessionsPayload(sessionsPayload);
      const storedLocalSessions = readStoredLocalSessions();
      const localPreferred = storedLocalSessions.find((session) => session.id === preferredSessionId);
      const preferred =
        preferredSessionId && remoteSessions.some((session) => session.id === preferredSessionId) ? preferredSessionId : remoteSessions[0]?.id;
      setSessions(remoteSessions);
      setLocalSessions(storedLocalSessions);
      setMemoryEnabled(memoryPayload?.preferences?.memoryEnabled !== false);
      setHistoryNotice('');

      if (localPreferred) {
        setSessionId(localPreferred.id);
        saveStoredValue(CURRENT_SESSION_KEY, localPreferred.id);
        setMessages(localPreferred.messages || []);
      } else if (preferred) {
        setSessionId(preferred);
        saveStoredValue(CURRENT_SESSION_KEY, preferred);
        const messagesPayload = await getChatSessionMessages(preferred);
        setMessages(normalizeMessagesPayload(messagesPayload).map(mapRemoteMessage));
      } else {
        setSessionId(null);
        setMessages([]);
        clearStoredValue(CURRENT_SESSION_KEY);
      }
    } catch (error) {
      restoreLocalChatState(preferredSessionId);
      setHistoryNotice('Chat history is local for now.');
      notify?.('Chat history is local for now.', 'warning', 'Chat history unavailable');
    } finally {
      setSessionsLoading(false);
    }
  }

  async function refreshSessions() {
    try {
      const payload = await getChatSessions();
      setSessions(normalizeSessionsPayload(payload));
      setHistoryNotice('');
    } catch {
      // Session refresh is non-blocking.
    }
  }

  async function startNewChat(showToast = false) {
    clearStoredMessages();
    setMessages([]);
    setInput('');
    setFeedback({});
    resetComposerHeight();
    setSessionsRailOpen(false);

    if (!auth?.authenticated) {
      activateLocalSession('New chat');
      setHistoryNotice('');
      if (showToast) notify?.('Started a new local chat.', 'info', 'New chat');
      return;
    }

    try {
      const payload = await createChatSession('New chat');
      const session = normalizeSessionPayload(payload);
      if (session?.id) {
        setSessionId(session.id);
        saveStoredValue(CURRENT_SESSION_KEY, session.id);
        setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      }
      setHistoryNotice('');
      if (showToast) notify?.('Started a new chat.', 'info', 'New chat');
    } catch (error) {
      activateLocalSession('New chat');
      setHistoryNotice('Chat history is local for now.');
      notify?.('Started a local chat. Backend chat history is unavailable.', 'warning', 'Local chat started');
    }
  }

  async function clearCurrentChat() {
    clearStoredMessages();
    setMessages([]);
    setInput('');
    setFeedback({});
    resetComposerHeight();

    if (isLocalSessionId(sessionId)) {
      setLocalSessions((current) => current.filter((session) => session.id !== sessionId));
      setSessionId(null);
      clearStoredValue(CURRENT_SESSION_KEY);
      notify?.('Current local chat cleared.', 'success', 'Chat cleared');
      return;
    }

    if (!auth?.authenticated || !sessionId) {
      notify?.('Current chat cleared.', 'success', 'Chat cleared');
      return;
    }

    try {
      await deleteChatSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setSessionId(null);
      clearStoredValue(CURRENT_SESSION_KEY);
      notify?.('Current chat cleared. Long-term memory was kept.', 'success', 'Chat cleared');
    } catch (error) {
      notify?.(error.message || 'Current chat could not be cleared.', 'error', 'Clear chat failed');
    }
  }

  async function deleteSessionFromRail(targetSessionId) {
    if (isLocalSessionId(targetSessionId)) {
      if (targetSessionId === 'local-current') {
        clearStoredMessages();
        setMessages([]);
        setFeedback({});
        notify?.('Local chat deleted.', 'success', 'Chat deleted');
        return;
      }

      setLocalSessions((current) => current.filter((session) => session.id !== targetSessionId));

      if (targetSessionId === sessionId) {
        setSessionId(null);
        setMessages([]);
        clearStoredValue(CURRENT_SESSION_KEY);
      }

      notify?.('Local chat deleted.', 'success', 'Chat deleted');
      return;
    }

    if (!auth?.authenticated) {
      clearCurrentChat();
      return;
    }

    try {
      await deleteChatSession(targetSessionId);
      setSessions((current) => current.filter((session) => session.id !== targetSessionId));

      if (targetSessionId === sessionId) {
        setSessionId(null);
        setMessages([]);
        clearStoredValue(CURRENT_SESSION_KEY);
      }

      notify?.('Chat deleted. Long-term memory was kept.', 'success', 'Chat deleted');
    } catch (error) {
      notify?.(error.message || 'Chat could not be deleted.', 'error', 'Delete failed');
    }
  }

  async function selectSession(nextSessionId) {
    if (!nextSessionId) {
      setSessionId(null);
      setMessages([]);
      setFeedback({});
      clearStoredValue(CURRENT_SESSION_KEY);
      return;
    }

    if (isLocalSessionId(nextSessionId)) {
      const session = localSessions.find((item) => item.id === nextSessionId) || buildGuestSessions(messages).find((item) => item.id === nextSessionId);
      setSessionId(nextSessionId);
      saveStoredValue(CURRENT_SESSION_KEY, nextSessionId);
      setMessages(session?.messages || []);
      setFeedback({});
      setSessionsRailOpen(false);
      return;
    }

    if (!auth?.authenticated) {
      setSessionsRailOpen(false);
      return;
    }

    setSessionId(nextSessionId);
    saveStoredValue(CURRENT_SESSION_KEY, nextSessionId);
    setFeedback({});
    setSessionsRailOpen(false);

    try {
      const payload = await getChatSessionMessages(nextSessionId);
      setMessages(normalizeMessagesPayload(payload).map(mapRemoteMessage));
    } catch (error) {
      notify?.(error.message || 'Chat messages could not load.', 'warning', 'Chat history unavailable');
    }
  }

  function activateLocalSession(title = 'New chat', initialMessages = []) {
    const session = createLocalSession(title, initialMessages);
    setSessionId(session.id);
    saveStoredValue(CURRENT_SESSION_KEY, session.id);
    setLocalSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
    return session;
  }

  function restoreLocalChatState(preferredSessionId) {
    const storedLocalSessions = readStoredLocalSessions();
    setSessions([]);
    setLocalSessions(storedLocalSessions);
    setMemoryEnabled(false);

    const preferred = storedLocalSessions.find((session) => session.id === preferredSessionId) || storedLocalSessions[0];
    if (preferred) {
      setSessionId(preferred.id);
      saveStoredValue(CURRENT_SESSION_KEY, preferred.id);
      setMessages(preferred.messages || []);
      return;
    }

    setSessionId(null);
    setMessages(readStoredMessages());
    clearStoredValue(CURRENT_SESSION_KEY);
  }

  async function copyResponse(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      notify?.('Copied AI response to clipboard.', 'success', 'Copied');
    } catch {
      notify?.('Clipboard access was unavailable in this browser.', 'warning', 'Copy unavailable');
    }
  }

  function resetComposerHeight() {
    if (!composerRef.current) return;
    composerRef.current.style.height = 'auto';
  }

  return (
    <section className={`assistant-workspace ${sessionsRailOpen ? 'rail-open' : ''}`}>
      {sessionsRailOpen ? (
        <button className="assistant-rail-backdrop" type="button" aria-label="Close recent chats" onClick={() => setSessionsRailOpen(false)} />
      ) : null}

      <SessionRail
        auth={auth}
        activeSessionId={sessionId}
        chatSearch={chatSearch}
        historyNotice={historyNotice}
        memoryEnabled={memoryEnabled}
        sessions={visibleSessions}
        sessionsLoading={sessionsLoading}
        onClearCurrentChat={clearCurrentChat}
        onClose={() => setSessionsRailOpen(false)}
        onDeleteSession={deleteSessionFromRail}
        onNewChat={() => startNewChat(true)}
        onSearchChange={setChatSearch}
        onSelectSession={selectSession}
      />

      <article className="assistant-conversation" aria-label="AI assistant conversation">
        <button className="icon-button rail-toggle-button rail-floating-button" type="button" aria-label="Open recent chats" onClick={() => setSessionsRailOpen(true)}>
          <Menu size={18} aria-hidden="true" />
        </button>

        <div className={`assistant-thread ${messages.length ? '' : 'is-empty'}`.trim()} ref={threadRef} role="log" aria-live="polite">
          <div className="assistant-thread-inner">
            {messages.length ? (
              <>
                <div className="chat-day-divider">
                  <span>Today</span>
                </div>
                {messages.map((message) => (
                  <div className={`message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={message.id}>
                    {message.role === 'ai' ? <span className="ai-avatar">AI</span> : null}
                    <div className="message-stack">
                      <div className={`message-bubble ${message.loading ? 'loading-bubble' : ''} ${message.error ? 'error-bubble' : ''}`.trim()}>
                        <ChatMessageText content={message.content} />
                        {message.role === 'ai' && !message.loading ? <MessageNotice message={message} /> : null}
                        {message.source === 'auth-required' ? <ConnectGitHubAction onConnectGitHub={onConnectGitHub} /> : null}
                        {message.list ? (
                          <ul className="answer-list">
                            {message.list.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                        <span className="message-time">{message.time}</span>
                      </div>
                      {message.role === 'ai' ? (
                        <div className="feedback-actions">
                          {!message.loading ? <MessageMetaButton message={message} /> : null}
                          <button type="button" aria-label="Copy response" onClick={() => copyResponse(message)}>
                            <Copy size={16} aria-hidden="true" />
                          </button>
                          <button
                            className={feedback[message.id] === 'up' ? 'active-feedback' : ''}
                            type="button"
                            aria-label="Like response"
                            aria-pressed={feedback[message.id] === 'up'}
                            onClick={() => setFeedback((current) => ({ ...current, [message.id]: current[message.id] === 'up' ? '' : 'up' }))}
                          >
                            <ThumbsUp size={16} aria-hidden="true" />
                          </button>
                          <button
                            className={feedback[message.id] === 'down' ? 'active-feedback' : ''}
                            type="button"
                            aria-label="Dislike response"
                            aria-pressed={feedback[message.id] === 'down'}
                            onClick={() => setFeedback((current) => ({ ...current, [message.id]: current[message.id] === 'down' ? '' : 'down' }))}
                          >
                            <ThumbsDown size={16} aria-hidden="true" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <AssistantWelcome greeting={greeting} prompts={starterPrompts} disabled={asking} onPromptClick={sendQuestion} />
            )}
          </div>
        </div>

        <form className="chat-form assistant-composer" onSubmit={handleSubmit}>
          <div className="composer-shell">
            <textarea
              ref={composerRef}
              value={input}
              onChange={handleComposerChange}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message your AI assistant"
              aria-label="Ask the AI assistant"
              aria-describedby="assistant-composer-hint"
              rows={1}
            />
            <button className="primary-icon-button" type="submit" disabled={asking || !input.trim()} aria-label="Send question">
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="composer-hint" id="assistant-composer-hint">
            <span>Enter to send</span>
            <span>Shift + Enter for a new line</span>
          </p>
        </form>
      </article>
    </section>
  );
}

function SessionRail({
  auth,
  activeSessionId,
  chatSearch,
  historyNotice,
  memoryEnabled,
  sessions,
  sessionsLoading,
  onClearCurrentChat,
  onClose,
  onDeleteSession,
  onNewChat,
  onSearchChange,
  onSelectSession
}) {
  return (
    <aside className="assistant-rail" aria-label="Recent chats">
      <div className="assistant-rail-header">
        <div>
          <strong>Recent chats</strong>
          <span>
            {historyNotice || (auth?.authenticated ? 'Saved in Supabase' : 'Local only')}
            {memoryEnabled ? ' - Memory on' : ' - Memory off'}
          </span>
        </div>
        <button className="icon-button small rail-close-button" type="button" aria-label="Close recent chats" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <button className="primary-button assistant-new-chat" type="button" onClick={onNewChat} aria-label="Start a new chat">
        <Plus size={16} aria-hidden="true" />
        New Chat
      </button>

      <label className="rail-search-field">
        <Search size={16} aria-hidden="true" />
        <input value={chatSearch} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search chats" aria-label="Search chats" />
      </label>

      <div className="assistant-rail-list">
        {sessionsLoading ? <p className="assistant-rail-empty">Loading chats...</p> : null}
        {!sessionsLoading && sessions.length ? (
          sessions.map((session) => (
            <SessionItem
              active={session.id === activeSessionId || (!auth?.authenticated && session.id === 'local-current')}
              key={session.id}
              session={session}
              onDeleteSession={onDeleteSession}
              onSelectSession={onSelectSession}
            />
          ))
        ) : null}
        {!sessionsLoading && !sessions.length ? (
          <div className="assistant-rail-empty">
            <strong>No chats yet</strong>
            <p>Start a new conversation to see it here.</p>
          </div>
        ) : null}
      </div>

      <div className="assistant-rail-footer">
        <button className="outline-button neutral compact-action" type="button" onClick={onClearCurrentChat}>
          <Trash2 size={15} aria-hidden="true" />
          Clear chat
        </button>
      </div>
    </aside>
  );
}

function SessionItem({ active, session, onDeleteSession, onSelectSession }) {
  return (
    <div className={`assistant-session-item ${active ? 'active' : ''}`.trim()}>
      <button className="assistant-session-button" type="button" aria-current={active ? 'page' : undefined} onClick={() => onSelectSession(session.id)}>
        <MessageSquare size={16} aria-hidden="true" />
        <span>
          <strong>{session.title || 'New chat'}</strong>
          <span className="assistant-session-meta">
            <em>{formatSessionTime(session.updatedAt || session.createdAt)}</em>
            {session.localOnly ? <small>Local</small> : null}
          </span>
        </span>
      </button>
      <button
        className="icon-button small session-delete-button"
        type="button"
        aria-label={`Delete chat ${session.title || 'New chat'}`}
        onClick={() => onDeleteSession(session.id)}
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function AssistantWelcome({ greeting, prompts, disabled, onPromptClick }) {
  return (
    <section className="assistant-welcome" aria-label="AI assistant welcome">
      <div className="assistant-welcome-inner">
        <h2>{greeting}</h2>
        <p className="assistant-welcome-subtitle">What would you like to explore today?</p>

        <div className="welcome-prompt-grid" aria-label="Suggested prompts">
          {prompts.map(({ prompt, Icon }) => (
            <button className="welcome-prompt-card" type="button" key={prompt} onClick={() => onPromptClick(prompt)} disabled={disabled}>
              <Icon size={19} aria-hidden="true" />
              <span>
                <strong>{prompt}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConnectGitHubAction({ onConnectGitHub }) {
  return (
    <button className="message-action-button" type="button" onClick={onConnectGitHub}>
      Connect GitHub
    </button>
  );
}

function MessageNotice({ message }) {
  if (message.source === 'supabase-fallback') {
    return <em className="message-notice">Answered from synced data fallback.</em>;
  }

  if (message.source === 'auth-required') {
    return <em className="message-notice">Connect GitHub to answer this.</em>;
  }

  if (message.source === 'error' || message.error) {
    return <em className="message-notice danger">Assistant error. Please try again.</em>;
  }

  if (message.warning) {
    return <em className="message-notice">{message.warning}</em>;
  }

  return null;
}

function MessageMetaButton({ message }) {
  const label = buildMessageMetadataLabel(message);

  return (
    <button className="message-meta-button" type="button" aria-label={label} title={label}>
      <Info size={15} aria-hidden="true" />
    </button>
  );
}

function getSourceLabel(message) {
  if (message.source === 'server-time') {
    return 'App context';
  }

  if (message.source === 'server-calculation') {
    return 'App calculation';
  }

  if (message.source === 'auth-required') {
    return 'GitHub required';
  }

  if (message.source === 'error') {
    return 'Assistant error';
  }

  if (message.source === 'ollama-general') {
    return 'General AI';
  }

  if (message.source === 'ollama-grounded' || message.source === 'anthropic') {
    return 'GitHub Data';
  }

  if (message.source === 'supabase-fallback') {
    return 'Synced Data Fallback';
  }

  if (message.requestedMode === 'auto' && message.mode === 'github') {
    return 'Auto-selected GitHub Data';
  }

  if (message.requestedMode === 'auto' && message.mode === 'general') {
    return 'Auto-selected General AI';
  }

  if (message.mode === 'github') {
    return 'GitHub Data';
  }

  if (message.mode === 'general') {
    return 'General AI';
  }

  return 'Unknown';
}

function buildMessageMetadataLabel(message) {
  const parts = [
    `Source: ${getSourceLabel(message)}`,
    `Mode: ${message.mode || message.requestedMode || 'auto'}`,
    `Live data used: ${message.usedLiveData ? 'yes' : 'no'}`
  ];

  if (message.memoryUsed) parts.push('Memory used: yes');
  return parts.join('. ');
}

function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function mapRemoteMessage(message) {
  return {
    id: message.id,
    role: message.role === 'assistant' ? 'ai' : 'user',
    time: formatMessageTime(message.createdAt),
    content: message.content,
    mode: message.mode,
    source: message.source,
    usedLiveData: message.usedLiveData ?? message.metadata?.usedLiveData,
    warning: message.metadata?.warning,
    memoryUsed: message.metadata?.memoryUsed,
    requestedMode: AUTO_MODE
  };
}

function normalizeSessionsPayload(payload) {
  const sessions = payload?.sessions || payload?.items || [];
  return Array.isArray(sessions) ? sessions.map((session) => ({ ...session, localOnly: Boolean(session.localOnly) })) : [];
}

function normalizeSessionPayload(payload) {
  const session = payload?.session || payload?.item || null;
  return session ? { ...session, localOnly: Boolean(session.localOnly) } : null;
}

function normalizeMessagesPayload(payload) {
  const messages = payload?.messages || payload?.items || [];
  return Array.isArray(messages) ? messages : [];
}

function formatMessageTime(value) {
  if (!value) return getTimeLabel();

  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatSessionTime(value) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function filterSessions(sessions, search) {
  const normalizedSearch = String(search || '').trim().toLowerCase();
  if (!normalizedSearch) return sessions;

  return sessions.filter((session) => String(session.title || '').toLowerCase().includes(normalizedSearch));
}

function buildGuestSessions(messages) {
  if (!messages.length) return [];

  const title = messages.find((message) => message.role === 'user')?.content || 'Local chat';
  return [
    {
      id: 'local-current',
      title: title.length > 46 ? `${title.slice(0, 43)}...` : title,
      updatedAt: null,
      localOnly: true,
      messages
    }
  ];
}

function isLocalSessionId(value) {
  return String(value || '').startsWith('local-');
}

function isBackendSessionId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

function createLocalSession(title = 'New chat', messages = []) {
  const now = new Date().toISOString();
  return {
    id: `local-${Date.now()}`,
    title: buildSessionTitle(title),
    createdAt: now,
    updatedAt: now,
    localOnly: true,
    messages: messages.filter((message) => !message.loading)
  };
}

function upsertLocalSessionMessages(sessions, sessionId, messages) {
  const cleanMessages = messages.filter((message) => !message.loading);
  const existing = sessions.find((session) => session.id === sessionId);
  const title = buildSessionTitle(cleanMessages.find((message) => message.role === 'user')?.content || existing?.title || 'New chat');
  const updatedSession = {
    ...(existing || createLocalSession(title)),
    id: sessionId,
    title,
    updatedAt: new Date().toISOString(),
    localOnly: true,
    messages: cleanMessages
  };

  return [updatedSession, ...sessions.filter((session) => session.id !== sessionId)];
}

function buildSessionTitle(value) {
  const title = String(value || 'New chat').replace(/\s+/g, ' ').trim();
  if (!title) return 'New chat';
  return title.length > 46 ? `${title.slice(0, 43)}...` : title;
}

function resizeComposer(element) {
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
}

function getGreetingName(user) {
  const value = [user?.displayName, user?.username].find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim().replace(/^@/, '') : '';
}

function readStoredMessages() {
  if (typeof window === 'undefined') return [];

  try {
    clearLegacyStoredMessages();
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((message) => message && !message.loading) : [];
  } catch {
    return [];
  }
}

function readStoredLocalSessions() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_CHAT_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((session) => isLocalSessionId(session?.id))
      .map((session) => ({
        id: session.id,
        title: buildSessionTitle(session.title || 'New chat'),
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
        localOnly: true,
        messages: Array.isArray(session.messages) ? session.messages.filter((message) => message && !message.loading) : []
      }));
  } catch {
    return [];
  }
}

function readStoredValue(key) {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveStoredValue(key, value) {
  if (typeof window === 'undefined' || !value) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore unavailable localStorage.
  }
}

function clearStoredValue(key) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore unavailable localStorage.
  }
}

function saveStoredMessages(messages) {
  if (typeof window === 'undefined') return;

  try {
    const savedMessages = messages.filter((message) => !message.loading);
    if (savedMessages.length) {
      window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(savedMessages));
      return;
    }
    clearStoredMessages();
  } catch {
    // Local chat history is a convenience, so storage failures should not block chat.
  }
}

function saveStoredLocalSessions(sessions) {
  if (typeof window === 'undefined') return;

  try {
    const cleanSessions = sessions
      .filter((session) => isLocalSessionId(session?.id))
      .slice(0, 25)
      .map((session) => ({
        ...session,
        localOnly: true,
        messages: Array.isArray(session.messages) ? session.messages.filter((message) => message && !message.loading) : []
      }));
    window.localStorage.setItem(LOCAL_CHAT_SESSIONS_KEY, JSON.stringify(cleanSessions));
  } catch {
    // Local chat history is a convenience, so storage failures should not block chat.
  }
}

function clearStoredMessages() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(CHAT_HISTORY_KEY);
    clearLegacyStoredMessages();
  } catch {
    // Ignore unavailable localStorage.
  }
}

function clearLegacyStoredMessages() {
  try {
    LEGACY_CHAT_HISTORY_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore unavailable localStorage.
  }
}

export default Chatbot;
