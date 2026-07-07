import { ChevronLeft, ChevronRight, Filter, Globe2, LockKeyhole, MoreVertical, Search, Star, TrendingUp, Trophy } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import RepoIcon from '../components/RepoIcon.jsx';
import Table from '../components/Table.jsx';
import { repositories, topRepoHighlights } from '../data/mockData.js';

const languageClass = {
  TypeScript: 'typescript',
  Python: 'python',
  Markdown: 'markdown',
  JavaScript: 'javascript'
};

function TopRepos() {
  const columns = [
    { key: 'rank', label: '#' },
    {
      key: 'name',
      label: 'Repository',
      render: (repo) => (
        <div className="repo-name">
          <RepoIcon type={repo.type} />
          <strong>{repo.name}</strong>
          <Star size={14} aria-hidden="true" />
        </div>
      )
    },
    {
      key: 'language',
      label: 'Language',
      render: (repo) => <span className={`language-pill ${languageClass[repo.language] || 'default'}`}>{repo.language}</span>
    },
    { key: 'commits', label: 'Commits (30d)' },
    { key: 'lastActivity', label: 'Last Activity' },
    {
      key: 'visibility',
      label: 'Visibility',
      render: (repo) => (
        <span className="visibility-pill">
          {repo.visibility === 'Public' ? <Globe2 size={13} aria-hidden="true" /> : <LockKeyhole size={13} aria-hidden="true" />}
          {repo.visibility}
        </span>
      )
    },
    {
      key: 'trend',
      label: 'Trend (30d)',
      render: (repo) => <MiniSparkline data={repo.trend} variant="primary" filled className="table-sparkline" />
    },
    {
      key: 'menu',
      label: '',
      render: () => (
        <button className="icon-button small" type="button" aria-label="Repository actions">
          <MoreVertical size={16} aria-hidden="true" />
        </button>
      )
    }
  ];

  return (
    <section className="top-repos-layout">
      <div className="repo-highlight-grid">
        {topRepoHighlights.map((item) => {
          const Icon = item.tone === 'success' ? TrendingUp : Trophy;

          return (
            <article className={`card repo-highlight-card tone-${item.tone}`} key={item.title}>
              <span className="stat-icon">
                <Icon size={28} aria-hidden="true" />
              </span>
              <div className="repo-highlight-copy">
                <span>{item.title}</span>
                <h2>{item.repo}</h2>
                <p>
                  <strong>{item.value}</strong>
                  {item.title === 'Most Active Repo' ? '' : ' '}
                  {item.title === 'Most Active Repo' ? null : <em>{item.change}</em>}
                </p>
                {item.title === 'Most Active Repo' ? <em>{item.change}</em> : null}
              </div>
              <MiniSparkline data={item.trend} variant={item.tone} filled className="hero-sparkline" />
            </article>
          );
        })}
      </div>

      <article className="card repo-table-card">
        <div className="table-card-toolbar">
          <h2>Repositories</h2>
          <div className="toolbar-actions">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <input type="search" placeholder="Search repositories..." />
            </label>
            <button className="outline-button neutral" type="button">
              <Filter size={17} aria-hidden="true" />
              Filter
            </button>
          </div>
        </div>

        <Table columns={columns} rows={repositories} className="repo-data-table" />

        <div className="pagination-footer">
          <span>Showing 1 to 8 of 24 repositories</span>
          <div className="pagination-buttons">
            <button type="button" aria-label="Previous page">
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <button className="active" type="button">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" aria-label="Next page">
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}

export default TopRepos;
