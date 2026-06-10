import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

// Component imports
import AuthScreen from './components/AuthScreen';
import DashboardTab from './components/DashboardTab';
import AnalyticsTab from './components/AnalyticsTab';
import WeeklyReportModal from './components/WeeklyReportModal';
import HabitModal from './components/HabitModal';

// ── Configuration & Types ──────────────────────────────────────────────────
const API_BASE = "http://127.0.0.1:8000";

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface Habit {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  frequency: "daily" | "weekly";
  category: "study" | "sport" | "sleep" | "nutrition" | "other";
  created_at: string;
}

interface HabitLog {
  id: number;
  habit_id: number;
  execution_date: string;
  is_completed: boolean;
}

interface UpcomingDueDate {
  habit_id: number;
  title: string;
  due_date: string;
  frequency: string;
}

interface WeeklyReport {
  habit_counts: { total: number; daily: number; weekly: number };
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

interface ChartData {
  completion_time_series: { date: string; count: number }[];
  category_bar: { category: string; xp: number }[];
  weekly_comparison: { week: string; completions: number }[];
}

interface Stats {
  total_xp: number;
  level: number;
  xp_progress: number;
  tree_stage: number;
  tree_stage_name: string;
  streak_current: number;
  streak_longest: number;
  habits_count: number;
  completions_count: number;
  completion_rate: number;
  category_stats: Record<string, number>;
  weekly_report: WeeklyReport;
  chart_data: ChartData;
}

interface FloatingXP {
  id: number;
  x: number;
  y: number;
  amount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseApiError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const fieldLabels: Record<string, string> = {
      password: "Пароль",
      username: "Ім'я користувача",
      email: "Email",
    };
    return detail
      .map((item: { msg?: string; loc?: (string | number)[] }) => {
        const field = String(item.loc?.slice(-1)[0] ?? "поле");
        const label = fieldLabels[field] ?? field;
        return `${label}: ${item.msg ?? "невалідне значення"}`;
      })
      .join(". ");
  }
  return "Помилка сервера. Спробуйте пізніше.";
}

// ── Icons ──────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 0-6 6v5a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6z" />
  </svg>
);

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(null);
  
  // App state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<Record<number, HabitLog[]>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<string>(() => formatLocalDate(new Date()));
  const [dateOverridden, setDateOverridden] = useState(false);
  const [devDateInput, setDevDateInput] = useState("");
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'about'>('dashboard');
  const [focusMode, setFocusMode] = useState<"all" | "study" | "sport" | "sleep" | "nutrition">("all");
  
  // Modals & UI Toggles
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  
  const [habitForm, setHabitForm] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly',
    category: 'study' as 'study' | 'sport' | 'sleep' | 'nutrition' | 'other'
  });
  
  // Feedback Animations
  const [floats, setFloats] = useState<FloatingXP[]>([]);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  // ── Sync Theme Accents with Focus Mode ──────────────────────────────────────
  useEffect(() => {
    document.body.setAttribute('data-mode', focusMode);
  }, [focusMode]);

  // ── API Fetchers ────────────────────────────────────────────────────────────
  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!token) return null;
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    };
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
      triggerToast("Сесія завершилась. Будь ласка, авторизуйтесь знову.", "error");
      return null;
    }
    return response;
  }, [token]);

  const fetchEffectiveDate = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/util/date`);
      if (res.ok) {
        const data = await res.json();
        setEffectiveDate(data.date);
        setDateOverridden(data.is_overridden);
        setDevDateInput(data.date);
      }
    } catch {
      setEffectiveDate(formatLocalDate(new Date()));
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/users/me");
      if (res && res.ok) {
        const u = await res.json();
        setUser(u);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }, [fetchWithAuth]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const resHabits = await fetchWithAuth("/api/habits/");
      if (resHabits && resHabits.ok) {
        const hList: Habit[] = await resHabits.json();
        setHabits(hList);
        
        const logMap: Record<number, HabitLog[]> = {};
        await Promise.all(
          hList.map(async (habit) => {
            const resLogs = await fetchWithAuth(`/api/habits/${habit.id}/logs`);
            if (resLogs && resLogs.ok) {
              const logs: HabitLog[] = await resLogs.json();
              logMap[habit.id] = logs;
            }
          })
        );
        setHabitLogs(logMap);
      }

      const resStats = await fetchWithAuth("/api/stats/");
      if (resStats && resStats.ok) {
        const s: Stats = await resStats.json();
        if (stats && s.level > stats.level) {
          triggerToast(`Рівень підвищено! Ви досягли рівня ${s.level}! 🌟`, "success");
        }
        setStats(s);
      }
    } catch (err) {
      console.error("Error loading tracker data:", err);
    }
  }, [token, fetchWithAuth, stats]);

  useEffect(() => {
    if (token) {
      fetchEffectiveDate();
      loadProfile();
      loadData();
    }
  }, [token]);

  // ── Authentication Handlers ─────────────────────────────────────────────────
  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    triggerToast("Вхід виконано! Ласкаво просимо в HabitForge.", "success");
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setHabits([]);
    setHabitLogs({});
    setStats(null);
    setDateOverridden(false);
    setEffectiveDate(formatLocalDate(new Date()));
    triggerToast("Ви вийшли з акаунта.", "info");
  };

  const handleDateOverride = async (dateValue: string | null) => {
    try {
      const res = await fetch(`${API_BASE}/api/util/date`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateValue }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(parseApiError(body.detail));
      }
      const data = await res.json();
      setEffectiveDate(data.date);
      setDateOverridden(data.is_overridden);
      setDevDateInput(data.date);
      await loadData();
      triggerToast(
        data.is_overridden
          ? `Віртуальна дата: ${data.date}`
          : "Дату скинуто до реальної",
        "info"
      );
    } catch (err: any) {
      triggerToast(err.message || "Не вдалося змінити дату", "error");
    }
  };

  // ── Feedback Animations ─────────────────────────────────────────────────────
  const triggerToast = useCallback((message: string, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const playFloatingXP = (x: number, y: number, amount: number) => {
    const id = Date.now();
    setFloats((prev) => [...prev, { id, x, y, amount }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  };

  // ── Habit Completions Toggles ───────────────────────────────────────────────
  const toggleHabitCompletion = async (habit: Habit, e: React.MouseEvent) => {
    const todayStr = effectiveDate;
    const logs = habitLogs[habit.id] || [];
    const todayLog = logs.find((l) => l.execution_date === todayStr);
    const wasCompleted = todayLog ? todayLog.is_completed : false;
    const isCompleted = !wasCompleted;

    playFloatingXP(e.clientX, e.clientY, habit.frequency === 'weekly' ? 30 : 10);

    try {
      const response = await fetchWithAuth(`/api/habits/${habit.id}/logs`, {
        method: "POST",
        body: JSON.stringify({
          execution_date: todayStr,
          is_completed: isCompleted
        })
      });
      if (response && response.ok) {
        const updatedLog: HabitLog = await response.json();
        setHabitLogs((prev) => {
          const list = prev[habit.id] || [];
          const idx = list.findIndex((l) => l.execution_date === todayStr);
          if (idx > -1) {
            const newList = [...list];
            newList[idx] = updatedLog;
            return { ...prev, [habit.id]: newList };
          } else {
            return { ...prev, [habit.id]: [...list, updatedLog] };
          }
        });
        
        const resStats = await fetchWithAuth("/api/stats/");
        if (resStats && resStats.ok) {
          const s = await resStats.json();
          setStats(s);
        }

        triggerToast(isCompleted ? "Звичку виконано! +XP 🌱" : "Відмітку скасовано.", "success");
      }
    } catch (err) {
      console.error("Error toggling completion log:", err);
    }
  };

  // ── Habit CRUD Form Handlers ────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingHabit(null);
    setHabitForm({
      title: '',
      description: '',
      frequency: 'daily',
      category: focusMode === "all" ? "study" : focusMode
    });
    setShowHabitModal(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitForm({
      title: habit.title,
      description: habit.description || '',
      frequency: habit.frequency,
      category: habit.category
    });
    setShowHabitModal(true);
  };

  const handleHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHabit) {
        const response = await fetchWithAuth(`/api/habits/${editingHabit.id}`, {
          method: "PUT",
          body: JSON.stringify(habitForm)
        });
        if (response && response.ok) {
          const updated: Habit = await response.json();
          setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
          triggerToast("Звичку успішно оновлено!", "success");
        }
      } else {
        const response = await fetchWithAuth("/api/habits/", {
          method: "POST",
          body: JSON.stringify(habitForm)
        });
        if (response && response.ok) {
          const created: Habit = await response.json();
          setHabits((prev) => [created, ...prev]);
          triggerToast("Звичку успішно додано! 🌱", "success");
        }
      }
      setShowHabitModal(false);
      loadData();
    } catch (err) {
      console.error("Error submitting habit form:", err);
    }
  };

  const handleDeleteHabit = async (habitId: number) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю звичку і всю її історію?")) return;
    try {
      const response = await fetchWithAuth(`/api/habits/${habitId}`, {
        method: "DELETE"
      });
      if (response && response.ok) {
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
        triggerToast("Звичку видалено.", "info");
        loadData();
      }
    } catch (err) {
      console.error("Error deleting habit:", err);
    }
  };

  // ── Filters & Metrics ───────────────────────────────────────────────────────
  const filteredHabits = useMemo(() => {
    if (focusMode === "all") return habits;
    return habits.filter((h) => h.category === focusMode);
  }, [habits, focusMode]);

  const isHabitCompletedToday = (habitId: number) => {
    const logs = habitLogs[habitId] || [];
    return logs.some((l) => l.execution_date === effectiveDate && l.is_completed);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <AuthScreen
        apiBase={API_BASE}
        onLoginSuccess={handleLoginSuccess}
        triggerToast={triggerToast}
        parseApiError={parseApiError}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Dynamic particles container */}
      <div className="particle-container">
        {floats.map((f) => (
          <div key={f.id} className="xp-float-number" style={{ left: f.x - 20, top: f.y - 40 }}>
            +{f.amount} XP
          </div>
        ))}
      </div>

      {/* Global Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast" style={{ borderLeftColor: t.type === 'error' ? '#ef4444' : 'var(--accent-primary)' }}>
            <div>{t.type === 'error' ? '❌' : '🌱'}</div>
            <div>{t.message}</div>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">HF</div>
          <div className="brand-name">HabitForge</div>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <HomeIcon />
            Дашборд
          </button>
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <ChartIcon />
            Аналітика
          </button>
          <button 
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <TrophyIcon />
            Довідка
          </button>
        </nav>

        {user && (
          <div className="user-profile-section">
            <div className="avatar">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <button onClick={handleLogout} className="logout-btn">Вийти</button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            dateOverridden={dateOverridden}
            effectiveDate={effectiveDate}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            filteredHabits={filteredHabits}
            isHabitCompletedToday={isHabitCompletedToday}
            toggleHabitCompletion={toggleHabitCompletion}
            openCreateModal={openCreateModal}
            openEditModal={openEditModal}
            handleDeleteHabit={handleDeleteHabit}
            setShowWeeklyReport={setShowWeeklyReport}
            fetchWithAuth={fetchWithAuth}
          />
        )}

        {activeTab === 'analytics' && stats && (
          <AnalyticsTab stats={stats} />
        )}

        {activeTab === 'about' && (
          <div className="card" style={{ textAlign: 'left', lineHeight: 1.6 }}>
            <h2 style={{ marginBottom: '15px', color: 'var(--text-heading)' }}>Про HabitForge</h2>
            <p style={{ marginBottom: '20px' }}>
              HabitForge — це інтерактивний інструмент, який поєднує гейміфікацію з поведінковою психологією.
              На відміну від звичайних трекерів, ваш успіх тут безпосередньо впливає на візуальну екосистему та ріст вашого персонального progress tree.
            </p>
            
            <h3 style={{ margin: '20px 0 10px', color: 'var(--text-heading)' }}>Як нараховуються бали досвіду (XP)?</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
              <li>Виконання <b>щоденної</b> звички приносить <b>+10 XP</b>.</li>
              <li>Виконання <b>щотижневої</b> звички приносить <b>+30 XP</b>.</li>
              <li>За підтримку максимальної поточної серії ви отримуєте бонус: <b>+10 XP</b> за кожен день серії!</li>
            </ul>

            <h3 style={{ margin: '20px 0 10px', color: 'var(--text-heading)' }}>Еволюція екосистеми</h3>
            <p style={{ marginBottom: '10px' }}>Кожні 300 XP ваше дерево переходить на новий етап росту:</p>
            <ol style={{ paddingLeft: '20px' }}>
              <li><b>Насіння:</b> від 0 до 299 XP</li>
              <li><b>Пагінець:</b> від 300 до 599 XP</li>
              <li><b>Саджанець:</b> від 600 до 899 XP</li>
              <li><b>Молоде дерево:</b> від 900 до 1199 XP</li>
              <li><b>Доросле дерево:</b> від 1200 до 1499 XP</li>
              <li><b>Квітуча екосистема:</b> 1500+ XP (додаються метелики, хмаринки та квіти!)</li>
            </ol>

            <div className="dev-date-panel">
              <h3 style={{ margin: '24px 0 10px', color: 'var(--text-heading)' }}>🛠 Тестова дата (dev)</h3>
              <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                Поточна ефективна дата сервера: <b>{effectiveDate}</b>
                {dateOverridden && " (перевизначено)"}
              </p>
              <div className="dev-date-controls">
                <input
                  type="date"
                  className="form-input"
                  value={devDateInput}
                  onChange={(e) => setDevDateInput(e.target.value)}
                />
                <button type="button" className="primary-btn" onClick={() => handleDateOverride(devDateInput)}>
                  Застосувати
                </button>
                <button type="button" className="secondary-btn" onClick={() => handleDateOverride(null)}>
                  Скинути
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Habit Creation/Editing Modal */}
      <HabitModal
        show={showHabitModal}
        editingHabit={editingHabit}
        habitForm={habitForm}
        setHabitForm={setHabitForm}
        onSubmit={handleHabitSubmit}
        onClose={() => setShowHabitModal(false)}
      />

      {/* Weekly Report Modal */}
      <WeeklyReportModal
        show={showWeeklyReport}
        stats={stats}
        onClose={() => setShowWeeklyReport(false)}
      />
    </div>
  );
}
