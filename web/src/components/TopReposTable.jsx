import { ArrowRight, Database, Monitor, PencilLine, Star, TerminalSquare, Zap } from 'lucide-react';
import MiniSparkline from './MiniSparkline.jsx';

const repoIcons = {
  site: Monitor,
  database: Database,
  terminal: TerminalSquare,
  notes: PencilLine,
  supabase: Zap
};

function TopReposTable({ repos }) {
  return (
    <article className="card repos-card">
      <div className="card-header">
        <div>
          <h2>Top Repositories</h2>
        </div>
        <a className="card-link compact" href="#repos">
          View all
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Repository</th>
              <th>Commits (30d)</th>
              <th>Last Activity</th>
              <th>Trend (30d)</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => {
              const Icon = repoIcons[repo.type] || Monitor;

              return (
                <tr key={repo.repoName}>
                  <td>
                    <div className="repo-name">
                      <span className={`repo-icon ${repo.type}`}>
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <strong>{repo.repoName}</strong>
                      <Star size={14} aria-hidden="true" />
                    </div>
                  </td>
                  <td>{repo.commits30d}</td>
                  <td>{repo.lastActivity}</td>
                  <td>
                    <MiniSparkline data={repo.trend} variant="primary" className="table-sparkline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default TopReposTable;
