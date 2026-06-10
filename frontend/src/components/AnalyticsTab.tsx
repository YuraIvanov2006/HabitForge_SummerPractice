import React from 'react';

interface Stats {
  category_stats: Record<string, number>;
  chart_data: {
    completion_time_series: { date: string; count: number }[];
    category_bar: { category: string; xp: number }[];
    weekly_comparison: { week: string; completions: number }[];
  };
}

interface AnalyticsTabProps {
  stats: Stats;
}

function categoryLabel(cat: string): string {
  if (cat === "study") return "📚 Навчання";
  if (cat === "sport") return "🏃 Спорт";
  if (cat === "sleep") return "😴 Сон";
  if (cat === "nutrition") return "🍎 Харчування";
  return "🧩 Інше";
}

export default function AnalyticsTab({ stats }: AnalyticsTabProps) {
  return (
    <div className="tab-stack">
      <div className="dashboard-title">
        <h1>Аналітика Продуктивності</h1>
        <p>Детальний розподіл ваших звичок та зусиль на основі даних API.</p>
      </div>

      <div className="dashboard-grid">

        {/* Time series from chart_data */}
        <div className="card chart-card-wide">
          <h3 className="card-title">Динаміка виконань (14 днів)</h3>
          <div className="chart-svg-container">
            <svg width="100%" height="100%" viewBox="0 0 420 180" preserveAspectRatio="xMidYMid meet">
              {(() => {
                const series = stats.chart_data.completion_time_series;
                const maxCount = Math.max(...series.map((p) => p.count), 1);
                const padL = 36;
                const padR = 16;
                const padT = 20;
                const padB = 36;
                const w = 420 - padL - padR;
                const h = 180 - padT - padB;
                const points = series.map((p, i) => {
                  const x = padL + (series.length <= 1 ? w / 2 : (i / (series.length - 1)) * w);
                  const y = padT + h - (p.count / maxCount) * h;
                  return `${x},${y}`;
                }).join(" ");
                return (
                  <>
                    <line x1={padL} y1={padT + h} x2={420 - padR} y2={padT + h} stroke="var(--text-muted)" strokeWidth="1.5" />
                    {[0, 0.5, 1].map((frac) => (
                      <line
                        key={frac}
                        x1={padL}
                        y1={padT + h * (1 - frac)}
                        x2={420 - padR}
                        y2={padT + h * (1 - frac)}
                        stroke="var(--border-light)"
                        strokeWidth="1"
                        strokeDasharray="4"
                      />
                    ))}
                    {series.length > 0 && (
                      <>
                        <polyline points={points} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinejoin="round" />
                        {series.map((p, i) => {
                          const x = padL + (series.length <= 1 ? w / 2 : (i / (series.length - 1)) * w);
                          const y = padT + h - (p.count / maxCount) * h;
                          return (
                            <g key={p.date}>
                              <circle cx={x} cy={y} r="4" fill="var(--accent-primary)" />
                              {(i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2)) && (
                                <text x={x} y={padT + h + 16} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                                  {p.date.slice(5)}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </>
                    )}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Weekly comparison */}
        <div className="card">
          <h3 className="card-title">Порівняння тижнів</h3>
          <div className="chart-svg-container">
            <svg width="100%" height="100%" viewBox="0 0 300 150">
              <line x1="30" y1="120" x2="280" y2="120" stroke="var(--text-muted)" strokeWidth="1.5" />
              {stats.chart_data.weekly_comparison.map((w, i) => {
                const maxVal = Math.max(...stats.chart_data.weekly_comparison.map((x) => x.completions), 1);
                const barH = Math.min(90, (w.completions / maxVal) * 90);
                const x = 80 + i * 100;
                return (
                  <g key={w.week}>
                    <rect x={x} y={120 - barH} width="50" height={barH} className="chart-svg-bar" style={{ fill: i === 1 ? 'var(--accent-primary)' : '#64748b' }} />
                    <text x={x + 25} y="135" textAnchor="middle" fontSize="9" fill="var(--text-muted)">{w.week.split('-W')[1] ?? w.week}</text>
                    <text x={x + 25} y={110 - barH} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-heading)">{w.completions}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="chart-caption">Минулий vs поточний тиждень (ISO)</p>
        </div>

        {/* Category XP bar chart from chart_data */}
        <div className="card">
          <h3 className="card-title">XP за категоріями</h3>
          <div className="chart-svg-container">
            <svg width="100%" height="100%" viewBox="0 0 300 180">
              <line x1="30" y1="150" x2="280" y2="150" stroke="var(--text-muted)" strokeWidth="1.5" />
              {(() => {
                const bars = stats.chart_data.category_bar.length
                  ? stats.chart_data.category_bar
                  : Object.entries(stats.category_stats).map(([category, xp]) => ({ category, xp }));
                const maxXp = Math.max(...bars.map((b) => b.xp), 1);
                const slot = 240 / Math.max(bars.length, 1);
                return bars.map((b, i) => {
                  const barH = Math.min(110, (b.xp / maxXp) * 110);
                  const x = 40 + i * slot;
                  return (
                    <g key={b.category}>
                      <rect x={x} y={150 - barH} width={Math.min(40, slot - 10)} height={barH} className="chart-svg-bar" style={{ fill: 'var(--accent-primary)' }} />
                      <text x={x + 20} y="165" textAnchor="middle" fontSize="8" fill="var(--text-muted)">{b.category.slice(0, 4)}</text>
                      <text x={x + 20} y={140 - barH} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-heading)">{b.xp}</text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Category breakdown list */}
        <div className="card">
          <h3 className="card-title">Розподіл XP за категоріями</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {Object.entries(stats.category_stats).map(([cat, xp]) => {
              const maxXP = Math.max(...Object.values(stats.category_stats), 1);
              const pct = Math.round((xp / maxXP) * 100);
              return (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ fontWeight: 600 }}>{categoryLabel(cat)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{xp} XP</span>
                  </div>
                  <div className="xp-progress-container" style={{ height: '8px' }}>
                    <div
                      className="xp-progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: cat === 'study' ? '#3b82f6' :
                                    cat === 'sport' ? '#f97316' :
                                    cat === 'sleep' ? '#6366f1' :
                                    cat === 'nutrition' ? '#14b8a6' : '#8b5cf6'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
