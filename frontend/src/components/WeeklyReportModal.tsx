
interface HabitCounts {
  total: number;
  daily: number;
  weekly: number;
}

interface UpcomingDueDate {
  habit_id: number;
  title: string;
  due_date: string;
  frequency: string;
}

interface WeeklyReport {
  habit_counts: HabitCounts;
  completed_this_week: number;
  average_streak: number;
  longest_streak: number;
  completions_by_day: Record<string, number>;
  upcoming_due_dates: UpcomingDueDate[];
  this_week_completions: number;
  last_week_completions: number;
  growth_rate: number;
  message: string;
}

interface Stats {
  weekly_report: WeeklyReport;
}

interface WeeklyReportModalProps {
  show: boolean;
  stats: Stats | null;
  onClose: () => void;
}

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WEEKDAY_UA: Record<string, string> = {
  Mon: "Пн", Tue: "Вт", Wed: "Ср", Thu: "Чт", Fri: "Пт", Sat: "Сб", Sun: "Нд",
};

export default function WeeklyReportModal({
  show,
  stats,
  onClose,
}: WeeklyReportModalProps) {
  if (!show || !stats) return null;

  const report = stats.weekly_report;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)', textAlign: 'center' }}>
          📊 Щотижневий звіт продуктивності
        </h2>

        <div className="weekly-report-body">
          <div className="weekly-stats-grid">
            <div className="weekly-stat-box">
              <span className="weekly-stat-value">{report.habit_counts.total}</span>
              <span className="weekly-stat-label">Звичок</span>
            </div>
            <div className="weekly-stat-box">
              <span className="weekly-stat-value">{report.habit_counts.daily}</span>
              <span className="weekly-stat-label">Щоденних</span>
            </div>
            <div className="weekly-stat-box">
              <span className="weekly-stat-value">{report.habit_counts.weekly}</span>
              <span className="weekly-stat-label">Щотижневих</span>
            </div>
            <div className="weekly-stat-box">
              <span className="weekly-stat-value">{report.average_streak}</span>
              <span className="weekly-stat-label">Сер. streak</span>
            </div>
            <div className="weekly-stat-box">
              <span className="weekly-stat-value">{report.longest_streak}</span>
              <span className="weekly-stat-label">Max streak</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)' }}>
                {report.this_week_completions}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Цей тиждень</p>
            </div>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-muted)' }}>
                {report.last_week_completions}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Минулий тиждень</p>
            </div>
          </div>

          <div>
            <h4 className="weekly-section-title">Виконання по днях тижня</h4>
            <div className="weekday-bars">
              {WEEKDAY_ORDER.map((day) => {
                const count = report.completions_by_day[day] ?? 0;
                const maxDay = Math.max(
                  ...WEEKDAY_ORDER.map((d) => report.completions_by_day[d] ?? 0),
                  1
                );
                return (
                  <div key={day} className="weekday-bar-col">
                    <div
                      className="weekday-bar-fill"
                      style={{ height: `${Math.max(8, (count / maxDay) * 72)}px` }}
                      title={`${WEEKDAY_UA[day]}: ${count}`}
                    />
                    <span className="weekday-bar-label">{WEEKDAY_UA[day]}</span>
                    <span className="weekday-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {report.upcoming_due_dates.length > 0 && (
            <div>
              <h4 className="weekly-section-title">Найближчі дедлайни</h4>
              <ul className="upcoming-due-list">
                {report.upcoming_due_dates.map((item) => (
                  <li key={`${item.habit_id}-${item.due_date}`}>
                    <span className="due-title">{item.title}</span>
                    <span className="due-meta">
                      {item.frequency === "daily" ? "Щодня" : "Щотижня"} · до {item.due_date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)' }}>
                {report.this_week_completions}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Цей тиждень</p>
            </div>
            <div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-muted)' }}>
                {report.last_week_completions}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Минулий тиждень</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={`growth-indicator ${
              report.growth_rate > 0 ? 'growth-up' : 
              report.growth_rate < 0 ? 'growth-down' : 'growth-stable'
            }`}>
              {report.growth_rate > 0 ? "📈" : report.growth_rate < 0 ? "📉" : "➡️"} 
              {report.growth_rate > 0 ? `+${report.growth_rate}%` : `${report.growth_rate}%`}
            </div>
          </div>

          <div className="report-recommendation">
            {report.message}
          </div>

          <button 
            className="primary-btn" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} 
            onClick={onClose}
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}
