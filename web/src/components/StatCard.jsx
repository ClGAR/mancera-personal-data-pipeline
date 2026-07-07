import MiniSparkline from './MiniSparkline.jsx';

function StatCard({ label, value, change, icon: Icon, tone, trendTone = 'success', sparkline }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-main">
        <div className="stat-icon">
          <Icon size={22} aria-hidden="true" />
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
