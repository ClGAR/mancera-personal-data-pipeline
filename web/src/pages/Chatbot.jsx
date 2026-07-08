import { Calendar, Code2, Copy, Lightbulb, Send, Sparkles, Star, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { askChatbot } from '../api.js';

const AUTO_MODE = 'auto';
const CHAT_HISTORY_KEY = 'pdp:ai-assistant-history';
const assistantHelperText = 'AI automatically uses your synced GitHub data when relevant, or answers general questions with your local Ollama model.';
const starterPrompts = [
  {
    label: 'GitHub data',
    prompt: 'Summarize my GitHub activity this week',
    Icon: TrendingUp
  },
  {
    label: 'GitHub data',
    prompt: 'Which repository had the most commits?',
    Icon: Calendar
  },
  {
    label: 'General AI',
    prompt: 'Explain OAuth 2.0 simply',
    Icon: Code2
  },
  {
    label: 'General AI',
    prompt: 'Help me improve this portfolio project',
    Icon: Sparkles
  },
  {
    label: 'General AI',
    prompt: 'What should I build next as a junior developer?',
    Icon: Star
  },
  {
    label: 'General AI',
    prompt: 'Explain Supabase RLS',
    Icon: Lightbulb
  }
];

function Chatbot({ auth, notify, chatResetNonce }) {
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [messages, setMessages] = useState(readStoredMessages);
  const greetingName = getGreetingName(auth?.user);
  const greeting = greetingName ? `Good to see you, ${greetingName}.` : 'Good to see you.';

  useEffect(() => {
    if (chatResetNonce) {
      clearStoredMessages();
      setMessages([]);
      setInput('');
      setFeedback({});
    }
  }, [chatResetNonce]);

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  async function sendQuestion(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || asking) return;

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
    setAsking(true);

    try {
      const result = await askChatbot(cleanQuestion, AUTO_MODE);
      const answer = result?.answer || 'I found your data, but there was no answer text in the response.';
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
                loading: false
              }
            : message
        )
      );
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

  async function copyResponse(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      notify?.('Copied AI response to clipboard.', 'success', 'Copied');
    } catch {
      notify?.('Clipboard access was unavailable in this browser.', 'warning', 'Copy unavailable');
    }
  }

  return (
    <section className="assistant-layout assistant-layout-single">
      <article className="card assistant-card">
        {messages.length ? (
          <div className="chat-day-divider">
            <span>Today</span>
          </div>
        ) : null}

        <div className={`assistant-thread ${messages.length ? '' : 'is-empty'}`.trim()}>
          {messages.length ? (
            messages.map((message) => (
              <div className={`message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={message.id}>
                {message.role === 'ai' ? <span className="ai-avatar">AI</span> : null}
                <div className="message-stack">
                  <div className={`message-bubble ${message.loading ? 'loading-bubble' : ''} ${message.error ? 'error-bubble' : ''}`.trim()}>
                    <p>{message.content}</p>
                    {message.role === 'ai' && !message.loading ? <SourceBadge message={message} /> : null}
                    {message.list ? (
                      <ul className="answer-list">
                        {message.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {message.warning ? <em className="message-warning">{message.warning}</em> : null}
                    <span>{message.time}</span>
                  </div>
                  {message.role === 'ai' ? (
                    <div className="feedback-actions">
                      <button type="button" aria-label="Copy response" onClick={() => copyResponse(message)}>
                        <Copy size={16} aria-hidden="true" />
                      </button>
                      <button
                        className={feedback[message.id] === 'up' ? 'active-feedback' : ''}
                        type="button"
                        aria-label="Like response"
                        onClick={() => setFeedback((current) => ({ ...current, [message.id]: current[message.id] === 'up' ? '' : 'up' }))}
                      >
                        <ThumbsUp size={16} aria-hidden="true" />
                      </button>
                      <button
                        className={feedback[message.id] === 'down' ? 'active-feedback' : ''}
                        type="button"
                        aria-label="Dislike response"
                        onClick={() => setFeedback((current) => ({ ...current, [message.id]: current[message.id] === 'down' ? '' : 'down' }))}
                      >
                        <ThumbsDown size={16} aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <AssistantWelcome
              greeting={greeting}
              prompts={starterPrompts}
              disabled={asking}
              onPromptClick={sendQuestion}
            />
          )}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your GitHub data or any development question..."
            aria-label="Ask the AI assistant"
          />
          <button className="primary-icon-button" type="submit" disabled={asking} aria-label="Send question">
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
        <p className="chat-disclaimer">{assistantHelperText}</p>
      </article>
    </section>
  );
}

function AssistantWelcome({ greeting, prompts, disabled, onPromptClick }) {
  return (
    <section className="assistant-welcome" aria-label="AI assistant welcome">
      <div className="assistant-welcome-inner">
        <span className="assistant-welcome-mark">
          <Sparkles size={24} aria-hidden="true" />
        </span>
        <h2>{greeting}</h2>
        <p className="assistant-welcome-subtitle">What would you like to explore today?</p>
        <p className="assistant-welcome-helper">Ask about your synced GitHub activity, or get help with broader software development questions.</p>

        <div className="welcome-prompt-grid" aria-label="Suggested prompts">
          {prompts.map(({ label, prompt, Icon }) => (
            <button className="welcome-prompt-card" type="button" key={prompt} onClick={() => onPromptClick(prompt)} disabled={disabled}>
              <Icon size={19} aria-hidden="true" />
              <span>
                <em>{label}</em>
                <strong>{prompt}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SourceBadge({ message }) {
  const badge = getSourceBadge(message);
  if (!badge) return null;

  return <span className={`source-badge source-${badge.variant}`}>{badge.label}</span>;
}

function getSourceBadge(message) {
  if (message.source === 'supabase-fallback') {
    return { label: 'Synced Data Fallback', variant: 'fallback' };
  }

  if (message.requestedMode === 'auto' && message.mode === 'github') {
    return { label: 'Auto-selected GitHub Data', variant: 'github' };
  }

  if (message.requestedMode === 'auto' && message.mode === 'general') {
    return { label: 'Auto-selected General AI', variant: 'general' };
  }

  if (message.mode === 'github') {
    return { label: 'GitHub Data', variant: 'github' };
  }

  if (message.mode === 'general') {
    return { label: 'General AI', variant: 'general' };
  }

  return null;
}

function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getGreetingName(user) {
  const value = [user?.displayName, user?.username].find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim().replace(/^@/, '') : '';
}

function readStoredMessages() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((message) => message && !message.loading) : [];
  } catch {
    return [];
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

function clearStoredMessages() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch {
    // Ignore unavailable localStorage.
  }
}

export default Chatbot;
