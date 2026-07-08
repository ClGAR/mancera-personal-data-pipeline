import { ArrowRight, BarChart3, Clock3, Lightbulb, TrendingUp } from 'lucide-react';
import LineChartCard from '../components/LineChartCard.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';

function WeeklyStats({ dashboardData, isLoading, dataMessage }) {
  const weekly = dashboardData?.weekly;
  const dailyCommitActivity = weekly?.dailyCommitActivity || [];
  const chartMax = getChartMax(dailyCommitActivity, 10);
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
    { key: 'commits', label: 'Commits' },
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

      <section className="stats-grid" aria-label="Weekly statistics">
        {(weekly?.weeklyStats || []).map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="weekly-layout">
        <LineChartCard
          title="Daily Commit Activity"
          data={dailyCommitActivity}
          controls={['Last 7 days', 'Line']}
          maxValue={chartMax}
          yTicks={buildTicks(chartMax)}
          showPointLabels
          compact
          className="daily-chart-card"
        />

        <article className="card breakdown-card">
          <div className="card-header">
            <h2>Breakdown by Day</h2>
          </div>
          <Table columns={columns} rows={weekly?.dayBreakdown || []} />
          <button className="text-link" type="button">
            View full week history
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
                <p>{weekly?.insights?.growth}</p>
                <span>{weekly?.insights?.growthDetail}</span>
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

          <div className="highlight-box">
            {weekly?.insights?.highlight}
          </div>
        </article>
      </section>
    </>
  );
}

function getChartMax(data, fallback) {
  const max = Math.max(...data.map((item) => item.value), fallback);
  return Math.ceil(max / 10) * 10;
}

function buildTicks(max) {
  return [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];
}

export default WeeklyStats;
