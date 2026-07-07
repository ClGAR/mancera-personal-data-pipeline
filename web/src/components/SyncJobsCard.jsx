import { ArrowRight, CheckCircle2, Clock3, Timer, XCircle } from 'lucide-react';

function SyncJobsCard({ runs }) {
  return (
    <article className="card sync-card">
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
        <span className="metric-chip">Hourly Cron</span>
      </div>

      <div className="sync-list">
        {runs.map((run) => {
          const Icon = run.status === 'failed' ? XCircle : CheckCircle2;

          return (
            <div className="sync-row" key={run.id}>
              <strong>{run.created_at}</strong>
              <span className={`run-status ${run.status}`}>
                <Icon size={12} aria-hidden="true" />
                {run.status}
              </span>
              <span className="duration">{run.duration}</span>
            </div>
          );
        })}
      </div>

      <a className="card-link" href="#sync-history">
        View all sync history
        <ArrowRight size={15} aria-hidden="true" />
      </a>
    </article>
  );
}

export default SyncJobsCard;
