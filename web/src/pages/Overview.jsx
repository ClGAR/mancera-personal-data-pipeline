import { ArrowRight, Bot, ChevronRight, Clock3, Copy, Github, Info, Plug, Send, ThumbsDown, ThumbsUp, Timer, Zap } from 'lucide-react';
import { useState } from 'react';
import { askChatbot } from '../api.js';
import Badge from '../components/Badge.jsx';
import ChatMessageText from '../components/ChatMessageText.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import RepoIcon from '../components/RepoIcon.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';

const integrationIcons = {
  supabase: Zap,
  github: Github,
  webhook: Plug,
  ai: Bot
};
const AUTO_MODE = 'auto';
const miniQuickPrompts = [
  { label: 'Top repo', prompt: 'Which repository had the most commits?' },
  { label: 'This week summary', prompt: 'Summarize my GitHub activity this week' },
  { label: 'Latest sync', prompt: 'What happened in my latest sync?' }
];

function Overview({ onNavigate, dashboardData, isLoading, dataMessage, notify, onConnectGitHub }) {
  const weekly = dashboardData?.weekly;
  const topRepos = dashboardData?.topRepos;
  const sync = dashboardData?.sync;
  const integrations = dashboardData?.integrations;
  const overviewActivity = weekly?.overviewActivity || [];
  const overviewRepos = topRepos?.overviewRepos || [];
  const chartMax = getChartMax(overviewActivity, 10);
  const [chatInput, setChatInput] = useState('');
  const [chatAsking, setChatAsking] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [miniMessages, setMiniMessages] = useState([]);

  const repoColumns = [
    {
      key: 'name',
      label: 'Repository',
      render: (repo) => (
        <div className="repo-name">
          <RepoIcon type={repo.type} />
          <strong>{repo.name}</strong>
        </div>
      )
    },
    { key: 'commits', label: 'Commits (30d)' },
    { key: 'lastActivity', label: 'Last Activity' },
    {
      key: 'trend',
      label: 'Trend',
      render: (repo) => <MiniSparkline data={repo.trend} variant="primary" filled className="table-sparkline" />
    }
  ];

  async function submitMiniQuestion(questionText) {
    const question = questionText.trim();
    if (!question || chatAsking) return;

    const requestId = Date.now();
    const time = getTimeLabel();
    setChatInput('');
    setChatAsking(true);
    setMiniMessages((current) => [
      ...current,
      { id: `mini-user-${requestId}`, role: 'user', content: question, time, requestedMode: AUTO_MODE },
      { id: `mini-ai-${requestId}`, role: 'ai', content: 'Thinking through your question...', time, requestedMode: AUTO_MODE, loading: true }
    ]);

    try {
      const result = await askChatbot(question, AUTO_MODE);
      setMiniMessages((current) =>
        current.map((message) =>
          message.id === `mini-ai-${requestId}`
            ? {
                ...message,
                content: result?.answer || 'No answer text was returned.',
                loading: false,
                mode: result?.mode,
                source: result?.source,
                usedLiveData: result?.usedLiveData,
                memoryUsed: result?.memoryUsed,
                warning: result?.warning
              }
            : message
        )
      );
      if (result?.source === 'supabase-fallback') {
        notify?.('Ollama was unavailable, so the answer used synced Supabase data.', 'warning', 'AI fallback used');
      }
    } catch (error) {
      setMiniMessages((current) =>
        current.map((message) =>
          message.id === `mini-ai-${requestId}`
            ? { ...message, content: error.message || 'The chatbot could not respond right now.', loading: false, error: true }
            : message
        )
      );
      notify?.(error.message || 'The chatbot could not respond right now.', 'error', 'Chatbot error');
    } finally {
      setChatAsking(false);
    }
  }

  function sendMiniQuestion(event) {
    event.preventDefault();
    submitMiniQuestion(chatInput);
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      notify?.('Copied chatbot response to clipboard.', 'success', 'Copied');
    } catch {
      notify?.('Clipboard access was unavailable in this browser.', 'warning', 'Copy unavailable');
    }
  }

  return (
    <>
      {isLoading ? <div className="state-banner">Loading your latest GitHub activity...</div> : null}
      {!isLoading && dataMessage ? <div className="state-banner muted-banner">{dataMessage}</div> : null}

      <section className="stats-grid" aria-label="Overview metrics">
        {(weekly?.overviewStats || []).map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="overview-grid">
        <LineChartCard
          title="Weekly Commit Activity"
          data={overviewActivity}
          controls={[<span className="chart-note-chip" key="latest-activity">Latest activity</span>]}
          maxValue={chartMax}
          yTicks={buildTicks(chartMax)}
          className="overview-chart-card"
        />

        <article className="card sync-summary-card">
          <div className="card-header">
            <div>
              <h2>
                <Timer size={20} aria-hidden="true" />
                Sync Jobs
              </h2>
              <span className="supporting-line">
                <Clock3 size={14} aria-hidden="true" />
                Backend cron sync runs hourly when enabled
              </span>
            </div>
            <Badge variant="success">Hourly Cron</Badge>
          </div>

          {sync?.overviewJobs?.length ? (
            <div className="mini-sync-list">
              {sync.overviewJobs.map((job) => (
                <div className={`mini-sync-row ${job.isLatestSuccess ? 'latest-success-row' : ''}`} key={job.id}>
                  <span>{job.time}</span>
                  <Badge variant={getStatusVariant(job.status)} icon>
                    {job.status}
                  </Badge>
                  <em>{job.duration}</em>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No sync jobs yet" message="Run Sync Now to create the first sync event." />
          )}

          <button className="text-link" type="button" onClick={() => onNavigate('syncHistory')}>
            View all sync history
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </article>

        <article className="card integrations-summary-card">
          <div className="card-header">
            <h2>
              <Plug size={20} aria-hidden="true" />
              Integrations
            </h2>
          </div>

          <div className="integration-list">
            {(integrations?.overview || []).map((integration) => {
              const Icon = integrationIcons[integration.type] || Plug;

              return (
                <button
                  className={`integration-row ${integration.status === 'Connected' ? '' : 'is-muted'}`}
                  type="button"
                  key={integration.name}
                  onClick={() => onNavigate('integrations')}
                >
                  <span className={`integration-icon ${integration.type}`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{integration.name}</strong>
                    <span>
                      <i />
                      {integration.status}
                    </span>
                  </div>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <button className="text-link" type="button" onClick={() => onNavigate('integrations')}>
            Manage integrations
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </article>

        <article className="card overview-repos-card">
          <div className="card-header">
            <h2>Top Repositories</h2>
            <button className="text-link compact" type="button" onClick={() => onNavigate('topRepos')}>
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
          {overviewRepos.length ? (
            <Table columns={repoColumns} rows={overviewRepos} />
          ) : (
            <EmptyState title="No repositories yet" message="Connect GitHub and run a sync to populate this table." />
          )}
        </article>

        <article className="card overview-chat-card">
          <div className="card-header">
            <h2>
              <Bot size={20} aria-hidden="true" />
              Ask the AI Assistant
            </h2>
            <button
              className="outline-button"
              type="button"
              onClick={() => {
                setMiniMessages([]);
                setFeedback({});
              }}
            >
              New Chat
            </button>
          </div>

          <div className="chat-thread compact-chat">
            {miniMessages.length ? (
              miniMessages.map((message) => (
                <div className={`message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={message.id}>
                  {message.role === 'ai' ? <span className="ai-avatar">AI</span> : null}
                  <div className="message-stack">
                    <div className={`message-bubble ${message.loading ? 'loading-bubble' : ''} ${message.error ? 'error-bubble' : ''}`.trim()}>
                      <ChatMessageText content={message.content} />
                      {message.role === 'ai' && !message.loading ? <MiniMessageNotice message={message} /> : null}
                      {message.source === 'auth-required' ? (
                        <button className="message-action-button" type="button" onClick={onConnectGitHub}>
                          Connect GitHub
                        </button>
                      ) : null}
                      <span className="message-time">{message.time}</span>
                    </div>
                    {message.role === 'ai' ? (
                      <div className="feedback-actions">
                        {!message.loading ? <MiniMessageMetaButton message={message} /> : null}
                        <button type="button" aria-label="Copy response" onClick={() => copyMessage(message)}>
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
              <div className="mini-chat-welcome">
                <strong>Ask a quick question</strong>
                <div className="mini-prompt-row" aria-label="Quick AI prompts">
                  {miniQuickPrompts.map((item) => (
                    <button type="button" key={item.label} onClick={() => submitMiniQuestion(item.prompt)} disabled={chatAsking}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form className="chat-form" onSubmit={sendMiniQuestion}>
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about your GitHub data or any development question..."
              aria-label="Ask a quick AI question"
            />
            <button className="primary-icon-button" type="submit" disabled={chatAsking} aria-label="Send question">
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
          <p className="chat-disclaimer">Ask about your GitHub data or any development question.</p>
        </article>
      </section>
    </>
  );
}

function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getChartMax(data, fallback) {
  const max = Math.max(...data.map((item) => item.value), fallback);
  return Math.ceil(max / 10) * 10;
}

function buildTicks(max) {
  return [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];
}

function getStatusVariant(status) {
  if (status === 'failed') return 'danger';
  if (status === 'success') return 'success';
  return 'neutral';
}

export default Overview;

function MiniMessageNotice({ message }) {
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

function MiniMessageMetaButton({ message }) {
  const label = buildMiniMessageMetadataLabel(message);

  return (
    <button className="message-meta-button" type="button" aria-label={label} title={label}>
      <Info size={15} aria-hidden="true" />
    </button>
  );
}

function getMiniSourceLabel(message) {
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

function buildMiniMessageMetadataLabel(message) {
  const parts = [
    `Source: ${getMiniSourceLabel(message)}`,
    `Mode: ${message.mode || message.requestedMode || 'auto'}`,
    `Live data used: ${message.usedLiveData ? 'yes' : 'no'}`
  ];

  if (message.memoryUsed) parts.push('Memory used: yes');
  return parts.join('. ');
}
