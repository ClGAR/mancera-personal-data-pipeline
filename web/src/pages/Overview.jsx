import { ArrowRight, Bot, ChevronRight, Clock3, Copy, Github, Plug, Send, ThumbsDown, ThumbsUp, Timer, Zap } from 'lucide-react';
import { useState } from 'react';
import { askChatbot } from '../api.js';
import Badge from '../components/Badge.jsx';
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

function Overview({ onNavigate, dashboardData, isLoading, dataMessage, notify }) {
  const weekly = dashboardData?.weekly;
  const topRepos = dashboardData?.topRepos;
  const sync = dashboardData?.sync;
  const integrations = dashboardData?.integrations;
  const overviewActivity = weekly?.overviewActivity || [];
  const overviewRepos = topRepos?.overviewRepos || [];
  const leadingRepo = overviewRepos[0];
  const chartMax = getChartMax(overviewActivity, 10);
  const [chatInput, setChatInput] = useState('');
  const [chatAsking, setChatAsking] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [miniMessages, setMiniMessages] = useState(() => buildMiniStarter(leadingRepo));

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

  async function sendMiniQuestion(event) {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || chatAsking) return;

    const requestId = Date.now();
    const time = getTimeLabel();
    setChatInput('');
    setChatAsking(true);
    setMiniMessages((current) => [
      ...current,
      { id: `mini-user-${requestId}`, role: 'user', content: question, time },
      { id: `mini-ai-${requestId}`, role: 'ai', content: 'Thinking through your synced GitHub data...', time, loading: true }
    ]);

    try {
      const result = await askChatbot(question);
      setMiniMessages((current) =>
        current.map((message) =>
          message.id === `mini-ai-${requestId}`
            ? { ...message, content: result?.answer || 'No answer text was returned.', loading: false, source: result?.source }
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
              Ask your GitHub data
            </h2>
            <button className="outline-button" type="button" onClick={() => setMiniMessages(buildMiniStarter(leadingRepo))}>
              New Chat
            </button>
          </div>

          <div className="chat-thread compact-chat">
            {miniMessages.map((message) => (
              <div className={`message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={message.id}>
                {message.role === 'ai' ? <span className="ai-avatar">AI</span> : null}
                <div className="message-stack">
                  <div className={`message-bubble ${message.loading ? 'loading-bubble' : ''} ${message.error ? 'error-bubble' : ''}`.trim()}>
                    <p>{message.content}</p>
                    <span>{message.time}</span>
                  </div>
                  {message.role === 'ai' ? (
                    <div className="feedback-actions">
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
            ))}
          </div>

          <form className="chat-form" onSubmit={sendMiniQuestion}>
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask anything about your GitHub data..."
              aria-label="Ask anything about your GitHub data"
            />
            <button className="primary-icon-button" type="submit" disabled={chatAsking} aria-label="Send question">
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
          <p className="chat-disclaimer">Answers are grounded in your synced repositories, commits, and sync history.</p>
        </article>
      </section>
    </>
  );
}

function buildMiniStarter(repo) {
  return [
    {
      id: 'mini-starter-user',
      role: 'user',
      content: 'Which repo had the most commits this month?',
      time: '09:15 AM'
    },
    {
      id: 'mini-starter-ai',
      role: 'ai',
      content: repo
        ? `Your repository "${repo.name}" is leading activity with ${repo.commits} commits.`
        : 'Your connected repository insights will appear here after the first sync.',
      time: '09:15 AM'
    }
  ];
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
