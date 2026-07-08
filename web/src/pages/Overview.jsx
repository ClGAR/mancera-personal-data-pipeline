import { ArrowRight, Bot, ChevronRight, Clock3, Copy, Github, Plug, Send, ThumbsDown, ThumbsUp, Timer, Zap } from 'lucide-react';
import Badge from '../components/Badge.jsx';
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

function Overview({ onNavigate, dashboardData, isLoading, dataMessage }) {
  const weekly = dashboardData?.weekly;
  const topRepos = dashboardData?.topRepos;
  const sync = dashboardData?.sync;
  const integrations = dashboardData?.integrations;
  const overviewActivity = weekly?.overviewActivity || [];
  const overviewRepos = topRepos?.overviewRepos || [];
  const leadingRepo = overviewRepos[0];
  const chartMax = getChartMax(overviewActivity, 10);
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
          controls={['Latest activity']}
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
                Automatic sync every hour
              </span>
            </div>
            <Badge variant="success">Hourly Cron</Badge>
          </div>

          <div className="mini-sync-list">
            {(sync?.overviewJobs || []).map((job) => (
              <div className={`mini-sync-row ${job.isLatestSuccess ? 'latest-success-row' : ''}`} key={job.id}>
                <span>{job.time}</span>
                <Badge variant={getStatusVariant(job.status)} icon>
                  {job.status}
                </Badge>
                <em>{job.duration}</em>
              </div>
            ))}
          </div>

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
          <Table columns={repoColumns} rows={overviewRepos} />
        </article>

        <article className="card overview-chat-card">
          <div className="card-header">
            <h2>
              <Bot size={20} aria-hidden="true" />
              Ask your GitHub data
            </h2>
            <button className="outline-button" type="button" onClick={() => onNavigate('chatbot')}>
              New Chat
            </button>
          </div>

          <div className="chat-thread compact-chat">
            <div className="message-row user-message">
              <div className="message-bubble">
                <p>Which repo had the most commits this month?</p>
                <span>09:15 AM</span>
              </div>
            </div>
            <div className="message-row assistant-message">
              <span className="ai-avatar">AI</span>
              <div className="message-stack">
                <div className="message-bubble">
                  <p>
                    {leadingRepo
                      ? `Your repository "${leadingRepo.name}" is leading activity with ${leadingRepo.commits} commits.`
                      : 'Your connected repository insights will appear here after the first sync.'}
                  </p>
                  <span>09:15 AM</span>
                </div>
                <div className="feedback-actions">
                  <button type="button" aria-label="Copy response">
                    <Copy size={16} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Like response">
                    <ThumbsUp size={16} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Dislike response">
                    <ThumbsDown size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="chat-form fake-chat-form">
            <span>Ask anything about your GitHub data...</span>
            <button className="primary-icon-button" type="button" onClick={() => onNavigate('chatbot')} aria-label="Open chatbot">
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
        </article>
      </section>
    </>
  );
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
