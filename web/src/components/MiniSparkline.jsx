function MiniSparkline({ data = [], variant = 'primary', filled = false, className = '' }) {
  const width = 118;
  const height = 38;
  const padding = 4;
  const values = data.length ? data : [1, 1];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = (width - padding * 2) / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y];
  });
  const linePath = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${height - padding} L ${points[0][0]} ${height - padding} Z`;

  return (
    <svg
      className={`mini-sparkline sparkline-${variant} ${filled ? 'is-filled' : ''} ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Trend line"
    >
      {filled ? <path className="sparkline-area" d={areaPath} /> : null}
      <path className="sparkline-line" d={linePath} />
    </svg>
  );
}

export default MiniSparkline;
