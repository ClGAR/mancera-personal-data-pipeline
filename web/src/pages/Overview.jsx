import { ArrowRight, Bot, ChevronRight, Clock3, Copy, Github, Plug, Send, ThumbsDown, ThumbsUp, Timer, Zap } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import RepoIcon from '../components/RepoIcon.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';
import {
  overviewActivity,
  overviewIntegrations,
  overviewRepos,
  overviewStats,
  overviewSyncJobs
} from '../data/mockData.js';

const integrationIcons = {
  supabase: Zap,
  github: Github,
  webhook: Plug,
  ai: Bot
};

function Overview({ onNavigate }) {
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
      <section className="stats-grid" aria-label="Overview metrics">
        {overviewStats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="overview-grid">
        <LineChartCard
          title="Weekly Commit Activity"
          data={overviewActivity}
          controls={['Last 12 weeks']}
          maxValue={250}
          yTicks={[0, 50, 100, 150, 200, 250]}
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
            {overviewSyncJobs.map((job) => (
              <div className="mini-sync-row" key={job.id}>
                <span>{job.time}</span>
                <Badge variant={job.status === 'failed' ? 'danger' : 'success'} icon>
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
            {overviewIntegrations.map((integration) => {
              const Icon = integrationIcons[integration.type] || Plug;

              return (
                <button className="integration-row" type="button" key={integration.name} onClick={() => onNavigate('integrations')}>
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
                  <p>Your repository "alexjohnson/portfolio" had the most commits this month with 48 commits.</p>
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

export default Overview;
