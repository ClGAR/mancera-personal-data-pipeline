import { useState } from 'react';
import { Calendar, Clock3, Filter, Info, ListFilter } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import Table from '../components/Table.jsx';

function SyncHistory({ dashboardData, isLoading, dataMessage }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const sync = dashboardData?.sync || {};
  const syncHistory = sync.history || [];
  const filteredHistory =
    statusFilter === 'all' ? syncHistory : syncHistory.filter((row) => row.status === statusFilter);
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
          {row.status === 'failed' ? <Info size={15} aria-hidden="true" /> : null}
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
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`.trim()}
            type="button"
            aria-pressed={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-chip ${statusFilter === 'success' ? 'active' : ''}`.trim()}
            type="button"
            aria-pressed={statusFilter === 'success'}
            onClick={() => setStatusFilter('success')}
          >
            <span className="status-dot" />
            Success
          </button>
          <button
            className={`filter-chip ${statusFilter === 'failed' ? 'active' : ''}`.trim()}
            type="button"
            aria-pressed={statusFilter === 'failed'}
            onClick={() => setStatusFilter('failed')}
          >
            <span className="status-dot danger" />
            Failed
          </button>
        </div>

        <div className="filter-group">
          <button className="outline-button neutral" type="button">
            <Calendar size={16} aria-hidden="true" />
            All Time
          </button>
          <button className="outline-button neutral" type="button">
            <Filter size={16} aria-hidden="true" />
            Filter
          </button>
        </div>
      </div>

      <article className="card sync-history-card">
        <div className="card-header subtle">
          <h2>
            <ListFilter size={18} aria-hidden="true" />
            Sync Runs
          </h2>
        </div>
        {!isLoading && filteredHistory.length === 0 ? (
          <div className="state-banner muted-banner">No sync runs match the selected filter.</div>
        ) : null}
        <Table columns={columns} rows={filteredHistory} className="sync-history-table" />
      </article>
    </section>
  );
}

function getStatusVariant(status) {
  if (status === 'failed') return 'danger';
  if (status === 'success') return 'success';
  return 'neutral';
}

export default SyncHistory;
