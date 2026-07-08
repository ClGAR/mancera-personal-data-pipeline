import { ArrowRight, BarChart3, Clock3, Lightbulb, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';

const rangeOptions = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days (local estimate)', days: 14 },
  { label: 'Last 30 days (local estimate)', days: 30 }
];

function WeeklyStats({ dashboardData, isLoading, dataMessage, onNavigate }) {
  const weekly = dashboardData?.weekly;
  const [rangeDays, setRangeDays] = useState(7);
  const [chartType, setChartType] = useState('line');
  const [sortDirection, setSortDirection] = useState('desc');
  const baseActivity = weekly?.dailyCommitActivity || [];
  const dailyCommitActivity = useMemo(() => buildRangeActivity(baseActivity, rangeDays), [baseActivity, rangeDays]);
  const chartMax = getChartMax(dailyCommitActivity, 10);
  const dayBreakdown = useMemo(
    () => buildBreakdown(dailyCommitActivity, sortDirection),
    [dailyCommitActivity, sortDirection]
  );
  const frontendOnlyRange = rangeDays !== 7;
  const columns = [
    {
      key: 'day',
      label: 'Day',
      render: (row) => (
        <div>
          <strong>{row.day}</strong>
          <span className="subtext">{row.date}</span>
        </div>
      )
    },
    {
      key: 'commits',
      label: (
        <button
          className="table-sort-button"
          type="button"
          aria-label={`Sort commits ${sortDirection === 'desc' ? 'ascending' : 'descending'}`}
          onClick={() => setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
        >
          Commits {sortDirection === 'desc' ? 'Desc' : 'Asc'}
        </button>
      ),
      sortDirection: sortDirection === 'desc' ? 'descending' : 'ascending'
    },
    {
      key: 'previous',
      label: 'vs Previous Day',
      render: (row) => <span className={`delta ${row.status}`}>{row.previous}</span>
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (row) =>
        row.trend?.length ? <MiniSparkline data={row.trend} variant="primary" className="table-sparkline" /> : <span className="muted">-</span>
    }
  ];

  return (
    <>
      {isLoading ? <div className="state-banner">Loading weekly stats...</div> : null}
      {!isLoading && dataMessage ? <div className="state-banner muted-banner">{dataMessage}</div> : null}
      {frontendOnlyRange ? (
        <div className="state-banner muted-banner">
          Local estimate: the backend currently returns a 7-day window, so this {rangeDays}-day range is projected from available synced data.
        </div>
      ) : null}

      <section className="stats-grid" aria-label="Weekly statistics">
        {(weekly?.weeklyStats || []).map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="weekly-layout">
        <LineChartCard
          title="Daily Commit Activity"
          data={dailyCommitActivity}
          controls={[
            <select
              className="select-button native-select"
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
              aria-label="Time range"
            >
              {rangeOptions.map((option) => (
                <option value={option.days} key={option.days}>
                  {option.label}
                </option>
              ))}
            </select>,
            <select
              className="select-button native-select"
              value={chartType}
              onChange={(event) => setChartType(event.target.value)}
              aria-label="Chart type"
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
            </select>
          ]}
          maxValue={chartMax}
          yTicks={buildTicks(chartMax)}
          showPointLabels={rangeDays <= 14}
          compact
          chartType={chartType}
          className="daily-chart-card"
        />

        <article className="card breakdown-card">
          <div className="card-header">
            <h2>Breakdown by Day</h2>
          </div>
          {dayBreakdown.length ? (
            <Table columns={columns} rows={dayBreakdown} />
          ) : (
            <EmptyState title="No commit activity yet" message="Run a sync to populate weekly commit analytics." />
          )}
          <button className="text-link" type="button" onClick={() => onNavigate('syncHistory')}>
            View full sync history
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </article>

        <article className="card insights-card">
          <div className="card-header">
            <h2>
              <Lightbulb size={20} aria-hidden="true" />
              Weekly Summary & Insights
            </h2>
          </div>

          <div className="insight-list">
            <div className="insight-row">
              <span className="insight-icon primary">
                <BarChart3 size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>Most Productive Day</strong>
                <p>{weekly?.insights?.bestDay}</p>
                <span>{weekly?.insights?.bestDayCommits}</span>
              </div>
            </div>
            <div className="insight-row">
              <span className="insight-icon success">
                <TrendingUp size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>Week over Week Growth</strong>
                <p>{frontendOnlyRange ? 'Frontend projection' : weekly?.insights?.growth}</p>
                <span>{frontendOnlyRange ? 'Backend range endpoint not added yet' : weekly?.insights?.growthDetail}</span>
              </div>
            </div>
            <div className="insight-row">
              <span className="insight-icon highlight">
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>Most Active Time</strong>
                <p>{weekly?.insights?.peakWindow}</p>
                <span>Your peak commit window</span>
              </div>
            </div>
          </div>

          <div className="highlight-box">{weekly?.insights?.highlight}</div>
        </article>
      </section>
    </>
  );
}

function buildRangeActivity(baseActivity, rangeDays) {
  const base = baseActivity.length ? baseActivity : [];
  if (rangeDays <= base.length) return base.slice(-rangeDays);
  if (!base.length) return [];

  return Array.from({ length: rangeDays }, (_, index) => {
    const baseItem = base[index % base.length];
    const cycle = Math.floor(index / base.length);
    const projectedValue = Math.max(0, Math.round(baseItem.value * (1 - cycle * 0.08)));

    return {
      ...baseItem,
      label: `${rangeDays - index}d`,
      subLabel: baseItem.subLabel || baseItem.label,
      value: projectedValue
    };
  });
}

function buildBreakdown(activity, sortDirection) {
  return activity
    .map((item, index) => {
      const previousValue = index > 0 ? activity[index - 1].value : null;
      const diff = previousValue === null ? null : item.value - previousValue;
      const percent = previousValue ? ` (${((diff / previousValue) * 100).toFixed(1)}%)` : '';
      const trend = activity.slice(Math.max(0, index - 8), index + 1).map((entry) => entry.value);

      return {
        id: `${item.label}-${index}`,
        day: item.subLabel || item.label,
        date: item.fullLabel || item.label,
        commits: item.value,
        previous: diff === null ? '-' : `${diff >= 0 ? '+' : ''}${diff}${percent}`,
        status: diff === null ? 'flat' : diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
        trend
      };
    })
    .sort((a, b) => (sortDirection === 'desc' ? b.commits - a.commits : a.commits - b.commits));
}

function getChartMax(data, fallback) {
  const max = Math.max(...data.map((item) => item.value), fallback);
  return Math.ceil(max / 10) * 10;
}

function buildTicks(max) {
  return [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];
}

export default WeeklyStats;
