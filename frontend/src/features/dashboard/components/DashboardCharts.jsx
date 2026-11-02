
import "./DashboardCharts.css";

const statusColors = {
  New: "#60a5fa",
  Contacted: "#fbbf24",
  Qualified: "#a78bfa",
  Converted: "#34d399",
  Lost: "#f87171",
};

const sourceColors = [
  "#8b7cff",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
];

export default function DashboardCharts({ statsData }) {
  const statuses = statsData?.statusCounts || [];
  const sources = statsData?.sourceCounts || [];

  const total = statsData?.totalLeads || 0;

  let currentPercentage = 0;

  const gradientParts = statuses.map((item) => {
    const percentage =
      total > 0 ? (item.count / total) * 100 : 0;

    const start = currentPercentage;
    currentPercentage += percentage;

    return `${statusColors[item.status] || "#64748b"} ${start}% ${currentPercentage}%`;
  });

  const chartBackground =
    total > 0
      ? `conic-gradient(${gradientParts.join(", ")})`
      : "#293247";

  const maxSourceCount = Math.max(
    ...sources.map((item) => item.count),
    1
  );

  return (
    <section className="dashboard-charts">

      {/* Lead Status Chart */}
      <article className="chart-card">
        <div className="chart-header">
          <div>
            <h2>Lead Status Overview</h2>
            <p>Distribution of leads by status</p>
          </div>
        </div>

        <div className="status-chart-content">

          <div
            className="status-donut"
            style={{
              background: chartBackground,
            }}
          >
            <div className="donut-center">
              <strong>{total}</strong>
              <span>Total Leads</span>
            </div>
          </div>

          <div className="status-legend">
            {statuses.map((item) => (
              <div
                className="legend-item"
                key={item.status}
              >
                <div className="legend-label">
                  <span
                    className="legend-dot"
                    style={{
                      backgroundColor:
                        statusColors[item.status] || "#64748b",
                    }}
                  />

                  <span>{item.status}</span>
                </div>

                <strong>{item.count}</strong>
              </div>
            ))}
          </div>

        </div>
      </article>

      {/* Lead Source Chart */}
      <article className="chart-card">
        <div className="chart-header">
          <div>
            <h2>Lead Source Overview</h2>
            <p>Where your leads are coming from</p>
          </div>
        </div>

        <div className="source-chart">
          {sources.length > 0 ? (
            sources.map((item, index) => {
              const percentage =
                (item.count / maxSourceCount) * 100;

              return (
                <div
                  className="source-item"
                  key={item.source || index}
                >
                  <div className="source-info">
                    <span>{item.source || "Other"}</span>
                    <strong>{item.count}</strong>
                  </div>

                  <div className="source-bar-track">
                    <div
                      className="source-bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          sourceColors[index % sourceColors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="chart-empty">
              No lead source data available.
            </p>
          )}
        </div>
      </article>

    </section>
  );
}
