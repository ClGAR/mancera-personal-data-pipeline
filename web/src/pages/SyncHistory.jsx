import { useMemo, useState } from 'react';
import { Calendar, Clock3, Filter, Github, Info, ListFilter, RefreshCcw } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import Table from '../components/Table.jsx';

const dateOptions = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' }
];

function SyncHistory({ dashboardData, isLoading, dataMessage, syncing, onRunSync, onConnectGitHub, auth }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [failedWithErrorsOnly, setFailedWithErrorsOnly] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const sync = dashboardData?.sync || {};
  const syncHistory = sync.history || [];
  const filteredHistory = useMemo(
    () =>
      syncHistory
        .filter((row) => statusFilter === 'all' || row.status === statusFilter)
        .filter((row) => matchesDateFilter(row, dateFilter))
        .filter((row) => !failedWithErrorsOnly || (row.status === 'failed' && row.error && row.error !== '-')),
    [syncHistory, statusFilter, dateFilter, failedWithErrorsOnly]
  );
  const columns = [
    {
      key: 'time',
      label: 'Sync Time',
      render: (row) => (
        <div>
          <strong>{row.time}</strong>
          <span className="subtext">{row.relative}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)} icon>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (row) => (
        <span className="duration-cell">
          <Clock3 size={14} aria-hidden="true" />
          {row.duration}
        </span>
      )
    },
    { key: 'repositories', label: 'Repositories' },
    { key: 'commits', label: 'Commits Imported' },
    {
      key: 'error',
      label: 'Error Message',
      render: (row) => (
        <span className="error-cell">
          {row.error}
          {row.status === 'failed' ? (
            <button className="icon-button small" type="button" aria-label="View full sync error" onClick={() => setSelectedError(row)}>
              <Info size={15} aria-hidden="true" />
            </button>
          ) : null}
        </span>
      )
    }
  ];

  return (
    <section className="sync-history-layout">
      {isLoading ? <div className="state-banner">Loading sync history...</div> : null}
      {!isLoading && sync.errorMessage ? <div className="state-banner error">Sync history could not load: {sync.errorMessage}</div> : null}
      {!isLoading && !sync.errorMessage && sync.emptyMessage ? <div className="state-banner muted-banner">{sync.emptyMessage}</div> : null}
      {!isLoading && dataMessage && !sync.errorMessage && !sync.emptyMessage ? (
        <div className="state-banner muted-banner">{dataMessage}</div>
      ) : null}

      <div className="filter-toolbar">
        <div className="filter-group">
          {['all', 'success', 'failed'].map((status) => (
            <button
              className={`filter-chip ${statusFilter === status ? 'active' : ''}`.trim()}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              key={status}
            >
              {status === 'success' ? <span className="status-dot" /> : null}
              {status === 'failed' ? <span className="status-dot danger" /> : null}
              {toTitle(status)}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <label className="select-with-icon">
            <Calendar size={16} aria-hidden="true" />
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Date filter">
              {dateOptions.map((option) => (
                <option value={option.id} key={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="outline-button neutral" type="button" onClick={() => setAdvancedOpen((current) => !current)}>
            <Filter size={16} aria-hidden="true" />
            Advanced
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={auth?.authenticated ? onRunSync : onConnectGitHub}
            disabled={syncing || auth?.loading}
            title={auth?.authenticated ? 'Run a manual GitHub sync' : 'Connect GitHub before syncing data.'}
          >
            {auth?.authenticated ? (
              <RefreshCcw className={syncing ? 'spin' : ''} size={16} aria-hidden="true" />
            ) : (
              <Github size={16} aria-hidden="true" />
            )}
            {auth?.authenticated ? (syncing ? 'Syncing...' : 'Run Manual Sync') : 'Connect GitHub'}
          </button>
        </div>
      </div>

      {advancedOpen ? (
        <div className="filter-panel">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={failedWithErrorsOnly}
              onChange={(event) => setFailedWithErrorsOnly(event.target.checked)}
            />
            <span>Show only failed runs with error messages</span>
          </label>
          <p className="panel-note">Filters are applied locally to the latest sync history returned by the backend.</p>
        </div>
      ) : null}

      <article className="card sync-history-card">
        <div className="card-header subtle">
          <h2>
            <ListFilter size={18} aria-hidden="true" />
            Sync Runs
          </h2>
        </div>
        {!isLoading && filteredHistory.length === 0 ? (
          <EmptyState
            title="No sync runs found"
            message={syncHistory.length ? 'No sync runs match the selected filters.' : 'Run a manual sync to create the first sync history entry.'}
          />
        ) : (
          <Table columns={columns} rows={filteredHistory} className="sync-history-table" />
        )}
      </article>

      {selectedError ? (
        <Modal title="Sync error details" onClose={() => setSelectedError(null)}>
          <dl className="modal-detail-list">
            <div>
              <dt>Sync time</dt>
              <dd>{selectedError.time}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedError.status}</dd>
            </div>
            <div>
              <dt>Error message</dt>
              <dd>{selectedError.error || 'No error message recorded'}</dd>
            </div>
          </dl>
        </Modal>
      ) : null}
    </section>
  );
}

function matchesDateFilter(row, filter) {
  if (filter === 'all') return true;
  const date = new Date(row.startedAt || row.time);
  if (Number.isNaN(date.getTime())) return true;
  const now = new Date();

  if (filter === 'today') return date.toDateString() === now.toDateString();

  const days = filter === '7d' ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

function toTitle(value) {
  if (value === 'all') return 'All';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusVariant(status) {
  if (status === 'failed') return 'danger';
  if (status === 'success') return 'success';
  return 'neutral';
}

export default SyncHistory;
