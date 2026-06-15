import React from 'react';
import EcosystemTree from './EcosystemTree';
import Heatmap from './Heatmap';
import EmptyState from './EmptyState';

interface Habit {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  frequency: "daily" | "weekly";
  category: "study" | "sport" | "sleep" | "nutrition" | "other";
  created_at: string;
}

interface Stats {
  level: number;
  total_xp: number;
  xp_progress: number;
  tree_stage: number;
  tree_stage_name: string;
  streak_current: number;
  streak_longest: number;
  completion_rate: number;
  weekly_report: {
    this_week_completions: number;
  };
}

interface DashboardTabProps {
  stats: Stats | null;
  dateOverridden: boolean;
  effectiveDate: string;
  focusMode: string;
  setFocusMode: (mode: any) => void;
  filteredHabits: Habit[];
  isHabitCompletedToday: (id: number) => boolean;
  toggleHabitCompletion: (habit: Habit, e: React.MouseEvent) => void;
  openCreateModal: () => void;
  openEditModal: (habit: Habit) => void;
  handleDeleteHabit: (id: number) => void;
  setShowWeeklyReport: (show: boolean) => void;
  fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function DashboardTab({
  stats,
  dateOverridden,
  effectiveDate,
  focusMode,
  setFocusMode,
  filteredHabits,
  isHabitCompletedToday,
  toggleHabitCompletion,
  openCreateModal,
  openEditModal,
  handleDeleteHabit,
  setShowWeeklyReport,
  fetchWithAuth,
}: DashboardTabProps) {
  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Мій Простір Звичок</h1>
          <p>
            Вітаємо назад! Слідкуйте за своїми щоденними рутинами.
            {dateOverridden && (
              <span className="date-override-badge"> 📅 Тестова дата: {effectiveDate}</span>
            )}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mode-selector">
          <button className={`mode-btn ${focusMode === 'all' ? 'active' : ''}`} onClick={() => setFocusMode('all')}>Всі</button>
          <button className={`mode-btn ${focusMode === 'study' ? 'active' : ''}`} onClick={() => setFocusMode('study')}>📚 Навчання</button>
          <button className={`mode-btn ${focusMode === 'sport' ? 'active' : ''}`} onClick={() => setFocusMode('sport')}>🏃 Спорт</button>
          <button className={`mode-btn ${focusMode === 'sleep' ? 'active' : ''}`} onClick={() => setFocusMode('sleep')}>😴 Сон</button>
          <button className={`mode-btn ${focusMode === 'nutrition' ? 'active' : ''}`} onClick={() => setFocusMode('nutrition')}>🍎 Харчування</button>
        </div>
      </header>

      {/* Overall Gamification XP card */}
      {stats && (
        <div className="card stats-summary-card">
          <div className="xp-level-row">
            <div className="level-title">
              <span className="level-label">Ваш Поточний Рівень</span>
              <span className="username" style={{ fontSize: '20px', fontWeight: 800 }}>Рівень {stats.level}</span>
            </div>
            <div className="level-badge">{stats.level}</div>
          </div>

          <div className="xp-progress-container">
            <div className="xp-progress-fill" style={{ width: `${stats.xp_progress}%` }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Етап: <b>{stats.tree_stage_name}</b></span>
            <span>{stats.total_xp} XP всього ({stats.xp_progress}/100 XP до наступного рівня)</span>
          </div>
        </div>
      )}

      {/* Metrics cards row */}
      {stats && (
        <div className="metrics-row">
          <div className="card metric-card">
            <div className="metric-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div className="metric-data">
              <span className="metric-value">{stats.streak_current} дн.</span>
              <span className="metric-label">Поточна серія 🔥</span>
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-icon-box" style={{ color: '#ea580c' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div className="metric-data">
              <span className="metric-value">{stats.streak_longest} дн.</span>
              <span className="metric-label">Найкраща серія 🏆</span>
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-icon-box" style={{ color: '#10b981' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div className="metric-data">
              <span className="metric-value">{stats.completion_rate}%</span>
              <span className="metric-label">Успішність 📈</span>
            </div>
          </div>

          <div className="card metric-card" style={{ cursor: 'pointer' }} onClick={() => setShowWeeklyReport(true)}>
            <div className="metric-icon-box" style={{ color: '#3b82f6' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="metric-data">
              <span className="metric-value" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Звіт 📋</span>
              <span className="metric-label">Цей тиждень: {stats.weekly_report.this_week_completions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard grid (Tree + Heatmap & List) */}
      <div className="dashboard-grid">
        
        {/* LEFT COLUMN: Heatmap + Habits List */}
        <div className="dashboard-column">
          
          {/* Heatmap Card */}
          <Heatmap
            focusMode={focusMode}
            effectiveDate={effectiveDate}
            fetchWithAuth={fetchWithAuth}
          />

          {/* Habits List Section */}
          <div className="habits-section">
            <div className="section-header-row">
              <h2 className="section-title">
                Мої Звички ({filteredHabits.length})
              </h2>
              <button className="primary-btn" onClick={openCreateModal}>
                <PlusIcon /> Додати звичку
              </button>
            </div>

            {filteredHabits.length === 0 ? (
              <EmptyState type="no-habits" onCTA={openCreateModal} />
            ) : (
              <div className="habits-grid">
                {filteredHabits.map((habit) => {
                  const isDoneToday = isHabitCompletedToday(habit.id);
                  return (
                    <div key={habit.id} className="habit-card">
                      <div className="habit-details">
                        <span className={`habit-category-tag tag-${habit.category}`}>
                          {habit.category}
                        </span>
                        <div className="habit-info-text">
                          <span className="habit-title" style={{ textDecoration: isDoneToday ? 'line-through' : 'none', opacity: isDoneToday ? 0.6 : 1 }}>
                            {habit.title}
                          </span>
                          {habit.description && (
                            <span className="habit-desc">{habit.description}</span>
                          )}
                          <span className="habit-frequency-indicator">
                            🔄 Періодичність: <b>{habit.frequency === 'daily' ? 'Щодня' : 'Щотижня'}</b>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button 
                          className={`habit-checkbox ${isDoneToday ? 'checked' : ''}`}
                          onClick={(e) => toggleHabitCompletion(habit, e)}
                          title="Позначити виконаною на сьогодні"
                        >
                          {isDoneToday && <CheckIcon />}
                        </button>

                        <div className="habit-actions">
                          <button className="secondary-btn" style={{ padding: '8px' }} onClick={() => openEditModal(habit)}>
                            <EditIcon />
                          </button>
                          <button className="danger-btn" onClick={() => handleDeleteHabit(habit.id)}>
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Ecosystem Progress Tree */}
        <div className="card tree-card">
          <div className="card-title" style={{ width: '100%', justifyContent: 'center' }}>
            <span>Екосистема Активності</span>
          </div>
          
          <div className="tree-container">
            <EcosystemTree stage={stats ? stats.tree_stage : 0} />
          </div>

          <div className="tree-label-overlay">
            <h3>{stats ? stats.tree_stage_name : "Насіння"}</h3>
            <p style={{ marginTop: '6px' }}>
              {stats && stats.total_xp >= 1500 
                ? "Вітаємо! Ваша екосистема повністю розквітла! 🌸" 
                : "Регулярно відмічайте звички, щоб допомогти дереву рости."
              }
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
