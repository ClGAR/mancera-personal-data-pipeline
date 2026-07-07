import { ArrowRight, BarChart3, Clock3, Lightbulb, TrendingUp } from 'lucide-react';
import LineChartCard from '../components/LineChartCard.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';
import { dailyCommitActivity, dayBreakdown, weeklyStats } from '../data/mockData.js';

function WeeklyStats() {
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
        row.trend.length ? <MiniSparkline data={row.trend} variant="primary" className="table-sparkline" /> : <span className="muted">-</span>
    }
  ];

  return (
    <>
      <section className="stats-grid" aria-label="Weekly statistics">
        {weeklyStats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="weekly-layout">
        <LineChartCard
          title="Daily Commit Activity"
          data={dailyCommitActivity}
          controls={['Last 7 days', 'Line']}
          maxValue={40}
          yTicks={[0, 10, 20, 30, 40]}
          showPointLabels
          compact
          className="daily-chart-card"
        />

        <article className="card breakdown-card">
          <div className="card-header">
            <h2>Breakdown by Day</h2>
          </div>
          <Table columns={columns} rows={dayBreakdown} />
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
                <p>Wednesday, May 14</p>
                <span>32 commits</span>
              </div>
            </div>
            <div className="insight-row">
              <span className="insight-icon success">
                <TrendingUp size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>Week over Week Growth</strong>
                <p>+18%</p>
                <span>vs May 4 - May 11</span>
              </div>
            </div>
            <div className="insight-row">
              <span className="insight-icon highlight">
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>Most Active Time</strong>
                <p>10:00 AM - 2:00 PM</p>
                <span>Your peak commit window</span>
              </div>
            </div>
          </div>

          <div className="highlight-box">
            You had 23 more commits this week compared to the previous 7-day period.
          </div>
        </article>
      </section>
    </>
  );
}

export default WeeklyStats;
