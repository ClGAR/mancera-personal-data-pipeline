import { ArrowRight, Calendar, ChevronRight, Code2, Copy, Flame, Lightbulb, Send, Sparkles, Star, ThumbsDown, ThumbsUp, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { askChatbot } from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import { suggestedPrompts } from '../data/mockData.js';

const promptIcons = [TrendingUp, Code2, Flame, Users, Calendar, Star, Sparkles, Lightbulb];
const extraPrompts = [
  'What changed since my latest sync?',
  'Summarize my most active repositories',
  'Which repository should I focus on next?',
  'Did any sync runs fail recently?'
];
const emptyRepositories = [];

function Chatbot({ dashboardData, notify, chatResetNonce }) {
  const repositories = dashboardData?.topRepos?.repositories ?? emptyRepositories;
  const starterMessages = useMemo(() => buildStarterMessages(repositories), [repositories]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [messages, setMessages] = useState(starterMessages);
  const prompts = expandedPrompts ? [...suggestedPrompts, ...extraPrompts] : suggestedPrompts;

  useEffect(() => {
    setMessages((current) => {
      const customMessages = current.filter((message) => !message.starter);
      return customMessages.length ? [...starterMessages, ...customMessages] : starterMessages;
    });
  }, [starterMessages]);

  useEffect(() => {
    if (chatResetNonce) {
      setMessages([]);
      setInput('');
      setFeedback({});
    }
  }, [chatResetNonce]);

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
        content: cleanQuestion
      },
      {
        id: `ai-${requestId}`,
        role: 'ai',
        time: timestamp,
        content: 'Thinking through your GitHub data...',
        loading: true
      }
    ]);
    setInput('');
    setAsking(true);

    try {
      const result = await askChatbot(cleanQuestion);
      const answer = result?.answer || 'I found your data, but there was no answer text in the response.';
      setMessages((current) =>
        current.map((message) =>
          message.id === `ai-${requestId}`
            ? {
                ...message,
                content: answer,
                source: result?.source,
                warning: result?.warning,
                loading: false
              }
            : message
        )
      );
      if (result?.source === 'supabase-fallback') {
        notify?.('Ollama was unavailable, so the answer used synced Supabase data.', 'warning', 'AI fallback used');
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
    await navigator.clipboard.writeText(message.content);
    notify?.('Copied AI response to clipboard.', 'success', 'Copied');
  }

  return (
    <section className="assistant-layout">
      <aside className="card prompt-card">
        <div className="card-header">
          <div>
            <h2>
              <Lightbulb size={20} aria-hidden="true" />
              Suggested prompts
            </h2>
            <p>Try asking about your GitHub data</p>
          </div>
        </div>

        <div className="prompt-list">
          {prompts.map((prompt, index) => {
            const Icon = promptIcons[index] || Sparkles;

            return (
              <button className="prompt-button" type="button" key={prompt} onClick={() => sendQuestion(prompt)} disabled={asking}>
                <Icon size={22} aria-hidden="true" />
                <span>{prompt}</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <button className="outline-button prompt-more" type="button" onClick={() => setExpandedPrompts((current) => !current)}>
          {expandedPrompts ? 'Show fewer examples' : 'View all examples'}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </aside>

      <article className="card assistant-card">
        <div className="chat-day-divider">
          <span>Today</span>
        </div>

        <div className="assistant-thread">
          {messages.length ? (
            messages.map((message) => (
              <div className={`message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={message.id}>
                {message.role === 'ai' ? <span className="ai-avatar">AI</span> : null}
                <div className="message-stack">
                  <div className={`message-bubble ${message.loading ? 'loading-bubble' : ''} ${message.error ? 'error-bubble' : ''}`.trim()}>
                    <p>{message.content}</p>
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
            <EmptyState title="New chat ready" message="Choose a suggested prompt or ask a question about your synced GitHub data." />
          )}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask anything about your GitHub data..."
            aria-label="Ask anything about your GitHub data"
          />
          <button className="primary-icon-button" type="submit" disabled={asking} aria-label="Send question">
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
        <p className="chat-disclaimer">Responses use local Ollama when available and stay grounded in synced GitHub data.</p>
      </article>
    </section>
  );
}

function buildStarterMessages(repositories) {
  const topRepo = repositories[0];
  const runnerUpRepos = repositories.slice(1, 4);
  const starterTime = '09:15 AM';

  return [
    {
      id: 'starter-user-top-repo',
      role: 'user',
      time: starterTime,
      content: 'Which repo had the most commits this month?',
      starter: true
    },
    {
      id: 'starter-ai-top-repo',
      role: 'ai',
      time: starterTime,
      content: topRepo
        ? `Your repository "${topRepo.name}" is currently leading activity with ${topRepo.commits} commits.`
        : 'Your top repository will appear here after your first successful sync.',
      list: runnerUpRepos.length
        ? runnerUpRepos.map((repo, index) => `${formatRank(index + 2)}: ${repo.name} - ${repo.commits} commits`)
        : null,
      starter: true
    }
  ];
}

function formatRank(rank) {
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default Chatbot;
