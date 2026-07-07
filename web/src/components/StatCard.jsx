import MiniSparkline from './MiniSparkline.jsx';
import { Activity, CheckCircle2, Flame, FolderGit2, Target } from 'lucide-react';

function StatCard({ label, value, change, icon: Icon, tone, trendTone = 'success', sparkline }) {
  const FallbackIcon =
    tone === 'success' ? FolderGit2 : tone === 'highlight' ? Flame : tone === 'status' ? CheckCircle2 : Target;
  const DisplayIcon = Icon || FallbackIcon || Activity;

  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-main">
        <div className="stat-icon">
          <DisplayIcon size={22} aria-hidden="true" />
        </div>
        <div>
          <span className="stat-title">{label}</span>
          <strong>{value}</strong>
        </div>
      </div>

      <div className="stat-card-bottom">
        <p className={`stat-change trend-${trendTone}`}>{change}</p>
        {sparkline ? <MiniSparkline data={sparkline} variant={tone === 'highlight' ? 'highlight' : tone} /> : null}
      </div>
    </article>
  );
}

export default StatCard;
