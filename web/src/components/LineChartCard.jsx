import { ChevronDown } from 'lucide-react';

function LineChartCard({
  title,
  data,
  controls = [],
  maxValue,
  yTicks,
  showPointLabels = false,
  className = '',
  compact = false,
  chartType = 'line'
}) {
  const width = 900;
  const height = compact ? 250 : 310;
  const padding = { top: showPointLabels ? 34 : 24, right: 24, bottom: 44, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.map((item) => item.value);
  const max = maxValue || Math.max(...values, 1);
  const ticks = yTicks || [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];
  const points = data.map((item, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (item.value / max) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${
    padding.top + chartHeight
  } Z`;
  const labelStep = data.length > 8 ? 2 : 1;

  return (
    <article className={`card line-chart-card ${className}`.trim()}>
      <div className="card-header chart-card-header">
        <div>
          <h2>
            {title}
          </h2>
          <span className="legend-dot">Commits</span>
        </div>

        {controls.length ? (
          <div className="chart-controls">
            {controls.map((control, index) =>
              typeof control === 'string' ? (
                <button className="select-button" type="button" key={control}>
                  {control}
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
              ) : (
                <div key={control?.key || index}>{control}</div>
              )
            )}
          </div>
        ) : null}
      </div>

      <div className="line-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <defs>
            <linearGradient id={`${title.replace(/\s+/g, '')}Area`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-fill)" />
              <stop offset="100%" stopColor="var(--chart-fill-end)" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => {
            const y = padding.top + chartHeight - (tick / max) * chartHeight;

            return (
              <g key={tick}>
                <line className="chart-grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text className="chart-y-label" x={padding.left - 14} y={y + 4} textAnchor="end">
                  {tick}
                </text>
              </g>
            );
          })}
          {chartType === 'bar' ? (
            points.map((point) => {
              const barWidth = Math.max(16, chartWidth / Math.max(points.length, 1) - 18);
              const barHeight = padding.top + chartHeight - point.y;

              return (
                <g key={`${point.label}-${point.value}`}>
                  <rect
                    className="chart-bar"
                    x={point.x - barWidth / 2}
                    y={point.y}
                    width={barWidth}
                    height={barHeight}
                    rx="8"
                  />
                  {showPointLabels ? (
                    <text className="chart-point-label" x={point.x} y={point.y - 13} textAnchor="middle">
                      {point.value}
                    </text>
                  ) : null}
                </g>
              );
            })
          ) : (
            <>
              <path className="chart-area" d={areaPath} fill={`url("#${title.replace(/\s+/g, '')}Area")`} />
              <path className="chart-line" d={linePath} />
              {points.map((point) => (
                <g key={`${point.label}-${point.value}`}>
                  {showPointLabels ? (
                    <text className="chart-point-label" x={point.x} y={point.y - 13} textAnchor="middle">
                      {point.value}
                    </text>
                  ) : null}
                  <circle className="chart-point" cx={point.x} cy={point.y} r="5" />
                </g>
              ))}
            </>
          )}
          {points
            .filter((_, index) => index % labelStep === 0 || index === points.length - 1)
            .map((point) => (
              <text className="chart-x-label" key={point.label} x={point.x} y={height - 18} textAnchor="middle">
                <tspan x={point.x}>{point.label}</tspan>
                {point.subLabel ? (
                  <tspan x={point.x} dy="16">
                    {point.subLabel}
                  </tspan>
                ) : null}
              </text>
            ))}
        </svg>
      </div>
    </article>
  );
}

export default LineChartCard;
