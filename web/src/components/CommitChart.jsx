import { ChevronDown, Info } from 'lucide-react';

function CommitChart({ data }) {
  const width = 760;
  const height = 310;
  const padding = { top: 24, right: 22, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxCommits = 250;
  const ticks = [0, 50, 100, 150, 200, 250];
  const points = data.map((item, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (item.commits / maxCommits) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${
    padding.top + chartHeight
  } Z`;

  return (
    <article className="card chart-card">
      <div className="card-header">
        <div>
          <h2>
            Weekly Commit Activity
            <Info size={15} aria-hidden="true" />
          </h2>
          <span className="legend-dot">Commits</span>
        </div>
        <button className="select-button" type="button">
          Last 12 weeks
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="line-chart" aria-label="Weekly commit activity">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Commit counts over the last 12 weeks">
          <defs>
            <linearGradient id="commitArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#5b3ff6" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#5b3ff6" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => {
            const y = padding.top + chartHeight - (tick / maxCommits) * chartHeight;

            return (
              <g key={tick}>
                <line className="chart-grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text className="chart-y-label" x={padding.left - 14} y={y + 4} textAnchor="end">
                  {tick}
                </text>
              </g>
            );
          })}
          <path className="chart-area" d={areaPath} />
          <path className="chart-line" d={linePath} />
          {points.map((point) => (
            <circle className="chart-point" cx={point.x} cy={point.y} key={point.label} r="5" />
          ))}
          {points
            .filter((_, index) => index % 2 === 0)
            .map((point) => (
              <text className="chart-x-label" key={point.label} x={point.x} y={height - 12} textAnchor="middle">
                {point.label}
              </text>
            ))}
        </svg>
      </div>
    </article>
  );
}

export default CommitChart;
