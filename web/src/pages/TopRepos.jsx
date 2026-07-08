import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Globe2,
  LockKeyhole,
  MoreVertical,
  Search,
  Star,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Dropdown from '../components/Dropdown.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import RepoIcon from '../components/RepoIcon.jsx';
import Table from '../components/Table.jsx';

const languageClass = {
  TypeScript: 'typescript',
  Python: 'python',
  Markdown: 'markdown',
  JavaScript: 'javascript'
};

const pageSize = 5;

function TopRepos({ dashboardData, isLoading, dataMessage, notify }) {
  const repoData = dashboardData?.topRepos;
  const repositories = repoData?.repositories || [];
  const topRepoHighlights = repoData?.highlights || [];
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [language, setLanguage] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [minCommits, setMinCommits] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);

  const languages = useMemo(() => [...new Set(repositories.map((repo) => repo.language).filter(Boolean))], [repositories]);
  const filteredRepos = useMemo(() => {
    const min = Number(minCommits || 0);
    return repositories.filter((repo) => {
      const matchesSearch = repo.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchesLanguage = language === 'all' || repo.language === language;
      const matchesVisibility = visibility === 'all' || repo.visibility === visibility;
      const matchesMin = Number(repo.commits || 0) >= min;
      return matchesSearch && matchesLanguage && matchesVisibility && matchesMin;
    });
  }, [repositories, search, language, visibility, minCommits]);
  const pageCount = Math.max(1, Math.ceil(filteredRepos.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRepos = filteredRepos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      render: (repo) => (
        <div className="row-action-anchor">
          <button
            className="icon-button small"
            type="button"
            aria-label={`Repository actions for ${repo.name}`}
            onClick={() => setOpenMenuId((current) => (current === repo.id ? '' : repo.id))}
          >
            <MoreVertical size={16} aria-hidden="true" />
          </button>
          {openMenuId === repo.id ? (
            <Dropdown onClose={() => setOpenMenuId('')}>
              <div className="dropdown-list compact-menu">
                <button className="dropdown-row" type="button" onClick={() => handleViewDetails(repo)}>
                  View details
                </button>
                <button className="dropdown-row" type="button" onClick={() => handleOpenGitHub(repo)}>
                  Open on GitHub
                </button>
                <button className="dropdown-row" type="button" onClick={() => handleCopyRepo(repo)}>
                  Copy repo name
                </button>
              </div>
            </Dropdown>
          ) : null}
        </div>
      )
    }
  ];

  function resetPage(updater) {
    setPage(1);
    updater();
  }

  function handleViewDetails(repo) {
    setOpenMenuId('');
    setSelectedRepo(repo);
  }

  function handleOpenGitHub(repo) {
    setOpenMenuId('');
    if (!repo.htmlUrl) {
      notify?.('This row does not include a GitHub URL from the current backend response.', 'warning', 'GitHub URL unavailable');
      return;
    }
    window.open(repo.htmlUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleCopyRepo(repo) {
    setOpenMenuId('');
    await navigator.clipboard.writeText(repo.name);
    notify?.('Repository name copied to clipboard.', 'success', 'Copied');
  }

  return (
    <section className="top-repos-layout">
      {isLoading ? <div className="state-banner">Loading repository rankings...</div> : null}
      {!isLoading && dataMessage ? <div className="state-banner muted-banner">{dataMessage}</div> : null}

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
              <input
                type="search"
                value={search}
                onChange={(event) => resetPage(() => setSearch(event.target.value))}
                placeholder="Search repositories..."
              />
            </label>
            <button className="outline-button neutral" type="button" onClick={() => setFiltersOpen((current) => !current)}>
              <Filter size={17} aria-hidden="true" />
              Filter
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="filter-panel">
            <label>
              <span>Language</span>
              <select value={language} onChange={(event) => resetPage(() => setLanguage(event.target.value))}>
                <option value="all">All languages</option>
                {languages.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Visibility</span>
              <select value={visibility} onChange={(event) => resetPage(() => setVisibility(event.target.value))}>
                <option value="all">All visibility</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </label>
            <label>
              <span>Minimum commits</span>
              <input
                type="number"
                min="0"
                value={minCommits}
                onChange={(event) => resetPage(() => setMinCommits(event.target.value))}
                placeholder="0"
              />
            </label>
          </div>
        ) : null}

        {pagedRepos.length ? (
          <Table columns={columns} rows={pagedRepos} className="repo-data-table" />
        ) : (
          <EmptyState title="No repositories match" message="Try adjusting search or filters." />
        )}

        <div className="pagination-footer">
          <span>
            Showing {filteredRepos.length ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredRepos.length)} of{' '}
            {filteredRepos.length} repositories
          </span>
          <div className="pagination-buttons">
            <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                className={currentPage === pageNumber ? 'active' : ''}
                type="button"
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>

      {selectedRepo ? (
        <Modal
          title="Repository details"
          onClose={() => setSelectedRepo(null)}
          footer={
            <>
              <button className="outline-button" type="button" onClick={() => handleCopyRepo(selectedRepo)}>
                Copy repo name
              </button>
              <button className="primary-button" type="button" onClick={() => handleOpenGitHub(selectedRepo)} disabled={!selectedRepo.htmlUrl}>
                <ExternalLink size={16} aria-hidden="true" />
                Open GitHub
              </button>
            </>
          }
        >
          <dl className="modal-detail-list">
            <div>
              <dt>Name</dt>
              <dd>{selectedRepo.name}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{selectedRepo.language}</dd>
            </div>
            <div>
              <dt>Commits imported</dt>
              <dd>{selectedRepo.commits}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>{selectedRepo.visibility}</dd>
            </div>
            <div>
              <dt>Last activity</dt>
              <dd>{selectedRepo.lastActivity}</dd>
            </div>
            <div>
              <dt>GitHub URL</dt>
              <dd>{selectedRepo.htmlUrl || 'Not included in the current backend response'}</dd>
            </div>
          </dl>
          <p className="modal-note">Growth and trend visuals are calculated from the available synced data in this dashboard.</p>
        </Modal>
      ) : null}
    </section>
  );
}

export default TopRepos;
