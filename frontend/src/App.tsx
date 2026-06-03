/*
frontend/src/App.tsx
───────────────────
Core React SPA for the HabitForge application.
Orchestrates authentication, habit tracking CRUD, Focus Modes,
XP/Level gamification, Git-style Heatmap, custom SVG tree growth,
and custom SVG analytical bar charts.
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

// ── Configuration ────────────────────────────────────────────────────────────
const API_BASE = "http://127.0.0.1:8000";

// ── Types ────────────────────────────────────────────────────────────────────
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

interface WeeklyReport {
  this_week_completions: number;
  last_week_completions: number;
  growth_rate: number;
  message: string;
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
}

interface FloatingXP {
  id: number;
  x: number;
  y: number;
  amount: number;
}

// ── Custom SVG Icons ─────────────────────────────────────────────────────────
const BookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const SportIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="1" />
    <path d="M4 9h5l1.5 2 1.5-2.5L10 6h4" />
    <path d="M12 10v4l-2 3" />
    <path d="M14 14l2 3" />
    <path d="M8 15h3.5" />
  </svg>
);

const SleepIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const NutritionIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 6V2" />
    <path d="M12 6c0 2 1.5 3 3.5 3" />
  </svg>
);

const OtherIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

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

// ── Application Root ─────────────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(null);
  
  // App state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<Record<number, HabitLog[]>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'about'>('dashboard');
  const [focusMode, setFocusMode] = useState<"all" | "study" | "sport" | "sleep" | "nutrition">("all");
  
  // Modals & UI Toggles
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  
  // Form States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  
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
      // Session expired
      localStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
      triggerToast("Сесія завершилась. Будь ласка, авторизуйтесь знову.", "error");
      return null;
    }
    return response;
  }, [token]);

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
      // 1. Fetch habits
      const resHabits = await fetchWithAuth("/api/habits/");
      if (resHabits && resHabits.ok) {
        const hList: Habit[] = await resHabits.json();
        setHabits(hList);
        
        // 2. Fetch logs for each habit
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

      // 3. Fetch analytics stats
      const resStats = await fetchWithAuth("/api/stats/");
      if (resStats && resStats.ok) {
        const s: Stats = await resStats.json();
        
        // Trigger level up animation if level increased
        if (stats && s.level > stats.level) {
          triggerToast(`Рівень підвищено! Ви досягли рівня ${s.level}! 🌟`, "success");
        }
        
        setStats(s);
      }
    } catch (err) {
      console.error("Error loading tracker data:", err);
    }
  }, [token, fetchWithAuth, stats]);

  // Load user info on mount/token change
  useEffect(() => {
    if (token) {
      loadProfile();
      loadData();
    }
  }, [token]);

  // ── Authentication Handlers ─────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: authForm.username,
            email: authForm.email,
            password: authForm.password
          })
        });
        if (!res.ok) {
          const detail = await res.json();
          throw new Error(detail.detail || "Помилка при реєстрації");
        }
        // Redirect to login automatically
        setAuthMode('login');
        triggerToast("Акаунт створено успішно! Будь ласка, увійдіть.", "success");
      } else {
        // OAuth2 Password Grant format (form urlencoded)
        const params = new URLSearchParams();
        params.append('username', authForm.email);
        params.append('password', authForm.password);

        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params
        });
        if (!res.ok) {
          const detail = await res.json();
          throw new Error(detail.detail || "Невірний email або пароль");
        }
        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        setToken(data.access_token);
        triggerToast("Вхід виконано! Ласкаво просимо в HabitForge.", "success");
      }
    } catch (err: any) {
      setAuthError(err.message || "Помилка сервера. Спробуйте пізніше.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setHabits([]);
    setHabitLogs({});
    setStats(null);
    triggerToast("Ви вийшли з акаунта.", "info");
  };

  // ── Feedback Animations ─────────────────────────────────────────────────────
  const triggerToast = (message: string, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const playFloatingXP = (x: number, y: number, amount: number) => {
    const id = Date.now();
    setFloats((prev) => [...prev, { id, x, y, amount }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  };

  // ── Habit Execution Completion Toggles ──────────────────────────────────────
  const toggleHabitCompletion = async (habit: Habit, e: React.MouseEvent) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = habitLogs[habit.id] || [];
    const todayLog = logs.find((l) => l.execution_date === todayStr);
    const wasCompleted = todayLog ? todayLog.is_completed : false;
    const isCompleted = !wasCompleted;

    // Trigger visual float indicator at click position
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
        // Optimistic / clean local updates
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
        
        // Reload global statistics immediately to update XP, streaks, level, and tree
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
        // Update habit
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
        // Create habit
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

  // Check if habit is completed today
  const isHabitCompletedToday = (habitId: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = habitLogs[habitId] || [];
    return logs.some((l) => l.execution_date === todayStr && l.is_completed);
  };

  // ── Render Heatmap Grid Cells ───────────────────────────────────────────────
  const heatmapData = useMemo(() => {
    const cells = [];
    const today = new Date();
    // We compute a 26-week calendar (half a year) to look tidy
    const totalDays = 26 * 7;
    
    // Find the starting Sunday of 26 weeks ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - totalDays);
    const startOffset = startDate.getDay(); // 0 is Sunday
    startDate.setDate(startDate.getDate() - startOffset);

    // Collect all unique completion dates for active filter mode
    const allCompletionDates: string[] = [];
    habits.forEach((habit) => {
      if (focusMode !== "all" && habit.category !== focusMode) return;
      const logs = habitLogs[habit.id] || [];
      logs.forEach((log) => {
        if (log.is_completed) {
          allCompletionDates.push(log.execution_date);
        }
      });
    });

    // Count completions per date
    const dateCounts: Record<string, number> = {};
    allCompletionDates.forEach((d) => {
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    });

    for (let i = 0; i < totalDays + startOffset; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const dateStr = cellDate.toISOString().split('T')[0];
      const count = dateCounts[dateStr] || 0;
      
      cells.push({
        date: dateStr,
        count: count > 4 ? 4 : count,
        completions: count,
        dayOfWeek: cellDate.getDay()
      });
    }
    return cells;
  }, [habits, habitLogs, focusMode]);

  // ── Analytical SVG Bar Charts ───────────────────────────────────────────────
  const activeStatsCount = useMemo(() => {
    if (!stats) return { total: 0, completions: 0 };
    return {
      total: stats.habits_count,
      completions: stats.completions_count
    };
  }, [stats]);

  // ── Render SVG Progress Tree ────────────────────────────────────────────────
  const renderEcosystemTree = () => {
    const stage = stats ? stats.tree_stage : 0;
    
    // Stages: 0 = Seed, 1 = Sprout, 2 = Sapling, 3 = Young Tree, 4 = Mature, 5 = Bloom
    return (
      <svg viewBox="0 0 200 200" className="tree-canvas-svg">
        <defs>
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-soft)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Ambient Sky Area background */}
        <circle cx="100" cy="100" r="90" fill="url(#skyGrad)" />

        {/* Ground */}
        <path d="M20 170 C 60 160, 140 160, 180 170 L 180 190 L 20 190 Z" fill="#1e293b" />
        <path d="M20 170 C 60 160, 140 160, 180 170" stroke="#10b981" strokeWidth="3" fill="none" opacity="0.6" />

        {/* Stage 0: Seed in Ground */}
        {stage === 0 && (
          <g>
            {/* Glowing spot */}
            <circle cx="100" cy="165" r="8" fill="var(--accent-primary)" opacity="0.4" className="tree-leaf" />
            <ellipse cx="100" cy="166" rx="3" ry="5" fill="#f59e0b" transform="rotate(15 100 166)" />
          </g>
        )}

        {/* Stage 1: Sprout */}
        {stage >= 1 && (
          <g className="tree-branch">
            {/* Stem */}
            <path d="M100 170 Q 98 145, 102 135" stroke="url(#trunkGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
            
            {/* Sprout Leaves */}
            {stage === 1 && (
              <g>
                <path d="M102 135 C 108 130, 115 132, 118 138 C 112 140, 106 138, 102 135" fill="url(#leafGrad)" className="tree-leaf" />
                <path d="M98 135 C 92 130, 85 132, 82 138 C 88 140, 94 138, 98 135" fill="url(#leafGrad)" className="tree-leaf" />
              </g>
            )}
          </g>
        )}

        {/* Stage 2: Sapling */}
        {stage >= 2 && (
          <g className="tree-branch">
            {/* Extended Trunk */}
            <path d="M100 170 Q 96 130, 104 110" stroke="url(#trunkGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Small branches */}
            <path d="M100 135 Q 85 125, 80 120" stroke="url(#trunkGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M101 125 Q 115 118, 122 112" stroke="url(#trunkGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Leaves */}
            {stage === 2 && (
              <g>
                {/* Branch leaves */}
                <circle cx="80" cy="120" r="8" fill="url(#leafGrad)" className="tree-leaf" />
                <circle cx="122" cy="112" r="8" fill="url(#leafGrad)" className="tree-leaf" />
                <circle cx="104" cy="110" r="10" fill="url(#leafGrad)" className="tree-leaf" />
              </g>
            )}
          </g>
        )}

        {/* Stage 3: Young Tree */}
        {stage >= 3 && (
          <g className="tree-branch">
            {/* Trunk */}
            <path d="M100 170 Q 94 110, 100 80" stroke="url(#trunkGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* Branches */}
            <path d="M97 130 Q 75 110, 70 95" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 115 Q 125 95, 130 85" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 95 Q 85 80, 85 70" stroke="url(#trunkGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />

            {/* Foliage spheres */}
            {stage === 3 && (
              <g>
                <circle cx="70" cy="95" r="15" fill="url(#leafGrad)" opacity="0.9" className="tree-leaf" />
                <circle cx="130" cy="85" r="16" fill="url(#leafGrad)" opacity="0.9" className="tree-leaf" />
                <circle cx="85" cy="70" r="14" fill="url(#leafGrad)" opacity="0.9" className="tree-leaf" />
                <circle cx="100" cy="80" r="18" fill="url(#leafGrad)" opacity="0.95" className="tree-leaf" />
              </g>
            )}
          </g>
        )}

        {/* Stage 4: Mature Tree */}
        {stage >= 4 && (
          <g className="tree-branch">
            {/* Thick Trunk */}
            <path d="M100 170 Q 92 100, 100 65" stroke="url(#trunkGrad)" strokeWidth="11" fill="none" strokeLinecap="round" />
            
            {/* Complex Branch System */}
            <path d="M96 125 Q 65 105, 55 90" stroke="url(#trunkGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M102 110 Q 135 90, 145 75" stroke="url(#trunkGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M97 90 Q 75 75, 72 55" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M101 80 Q 120 65, 125 50" stroke="url(#trunkGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
            
            {/* Dense Foliage spheres */}
            {stage === 4 && (
              <g className="tree-leaf">
                <circle cx="55" cy="90" r="22" fill="url(#leafGrad)" opacity="0.9" />
                <circle cx="145" cy="75" r="24" fill="url(#leafGrad)" opacity="0.9" />
                <circle cx="72" cy="55" r="20" fill="url(#leafGrad)" opacity="0.9" />
                <circle cx="125" cy="50" r="18" fill="url(#leafGrad)" opacity="0.9" />
                <circle cx="100" cy="60" r="26" fill="url(#leafGrad)" opacity="0.95" />
              </g>
            )}
          </g>
        )}

        {/* Stage 5: Blooming Ecosystem (Flowers, clouds, butterflies, floating petals) */}
        {stage === 5 && (
          <g>
            {/* Base Mature Tree Foliage */}
            <g className="tree-leaf">
              <circle cx="55" cy="90" r="23" fill="url(#leafGrad)" opacity="0.85" />
              <circle cx="145" cy="75" r="25" fill="url(#leafGrad)" opacity="0.85" />
              <circle cx="72" cy="55" r="21" fill="url(#leafGrad)" opacity="0.85" />
              <circle cx="125" cy="50" r="19" fill="url(#leafGrad)" opacity="0.85" />
              <circle cx="100" cy="60" r="28" fill="url(#leafGrad)" opacity="0.9" />
            </g>

            {/* Red Blooming Flowers */}
            <g className="tree-leaf">
              <circle cx="65" cy="85" r="4" fill="url(#flowerGrad)" />
              <circle cx="135" cy="70" r="5" fill="url(#flowerGrad)" />
              <circle cx="100" cy="50" r="4.5" fill="url(#flowerGrad)" />
              <circle cx="80" cy="55" r="4" fill="url(#flowerGrad)" />
              <circle cx="120" cy="55" r="5" fill="url(#flowerGrad)" />
              <circle cx="148" cy="82" r="4" fill="url(#flowerGrad)" />
            </g>

            {/* Butterflies & Clouds */}
            <g opacity="0.8" className="tree-leaf">
              {/* Cloud Left */}
              <path d="M15 45 a 6 6 0 0 1 12 0 a 8 8 0 0 1 14 2 a 6 6 0 0 1 -2 11 L 13 58 A 6 6 0 0 1 15 45 Z" fill="white" opacity="0.25" />
              {/* Cloud Right */}
              <path d="M155 35 a 5 5 0 0 1 10 0 a 7 7 0 0 1 12 2 a 5 5 0 0 1 -2 9 L 153 46 A 5 5 0 0 1 155 35 Z" fill="white" opacity="0.2" />

              {/* Butterflies */}
              <path d="M45 80 L 48 83 L 45 86 Z M48 83 L 51 80 L 51 86 Z" fill="#f59e0b" />
              <path d="M160 100 L 163 103 L 160 106 Z M163 103 L 166 100 L 166 106 Z" fill="var(--accent-primary)" />
            </g>
          </g>
        )}
      </svg>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // Render Auth screen if not logged in
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '30px' }}>
            <div className="brand-icon">HF</div>
            <div className="brand-name">HabitForge</div>
          </div>
          
          <h2 style={{ color: 'var(--text-heading)', textAlign: 'center', marginBottom: '8px' }}>
            {authMode === 'login' ? 'З поверненням!' : 'Створіть акаунт'}
          </h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '14px', marginBottom: '30px' }}>
            {authMode === 'login' 
              ? 'Авторизуйтесь для продовження відстеження.' 
              : 'Розпочніть будувати корисні звички сьогодні.'
            }
          </p>

          {authError && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '14px', 
              fontWeight: 500,
              marginBottom: '20px'
            }}>
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label">Ім'я користувача</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="john_doe"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{authMode === 'login' ? 'Email або Ім\'я' : 'Електронна пошта'}</label>
              <input 
                type={authMode === 'register' ? 'email' : 'text'} 
                className="form-input" 
                required
                placeholder={authMode === 'register' ? 'john@example.com' : 'email@example.com'}
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '30px' }}>
              <label className="form-label">Пароль</label>
              <input 
                type="password" 
                className="form-input" 
                required
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {authMode === 'login' ? 'Увійти' : 'Зареєструватися'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? 'Немає акаунту? ' : 'Вже маєте акаунт? '}
            <span 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              style={{ color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? 'Зареєструватися' : 'Увійти'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Main Dashboard Interface (Authenticated)
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
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <header className="dashboard-header">
              <div className="dashboard-title">
                <h1>Мій Простір Звичок</h1>
                <p>Вітаємо назад! Слідкуйте за своїми щоденними рутинами.</p>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Heatmap Card */}
                <div className="card">
                  <div className="card-title">
                    <span>Теплова Карта Активності ({focusMode === 'all' ? 'Всі звички' : `Фокус: ${focusMode}`})</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>За останні 6 місяців</span>
                  </div>
                  
                  <div className="heatmap-scroll-container">
                    <div className="heatmap-grid">
                      {heatmapData.map((cell, idx) => (
                        <div 
                          key={idx} 
                          className="heatmap-cell" 
                          data-count={cell.count}
                        >
                          <span className="tooltip">
                            {cell.date}: {cell.completions} відміток
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="heatmap-labels">
                    <span>Менше</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div className="heatmap-cell" data-count="0" style={{ cursor: 'default' }}></div>
                      <div className="heatmap-cell" data-count="1" style={{ cursor: 'default' }}></div>
                      <div className="heatmap-cell" data-count="2" style={{ cursor: 'default' }}></div>
                      <div className="heatmap-cell" data-count="3" style={{ cursor: 'default' }}></div>
                      <div className="heatmap-cell" data-count="4" style={{ cursor: 'default' }}></div>
                    </div>
                    <span>Більше</span>
                  </div>
                </div>

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
                    <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      📝 Не знайдено жодної звички у цій категорії. Натисніть кнопку вище, щоб створити її!
                    </div>
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
                  {renderEcosystemTree()}
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
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-title">
              <h1>Аналітика Продуктивності</h1>
              <p>Детальний розподіл ваших звичок та зусиль.</p>
            </div>

            <div className="dashboard-grid">
              
              {/* Category Breakdown list */}
              <div className="card">
                <h3 className="card-title">Розподіл XP за категоріями</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                  {Object.entries(stats.category_stats).map(([cat, xp]) => {
                    const maxXP = Math.max(...Object.values(stats.category_stats), 1);
                    const pct = Math.round((xp / maxXP) * 100);
                    return (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', textTransform: 'capitalize' }}>
                          <span style={{ fontWeight: 600 }}>
                            {cat === 'study' ? '📚 Навчання' : 
                             cat === 'sport' ? '🏃 Спорт' : 
                             cat === 'sleep' ? '😴 Сон' : 
                             cat === 'nutrition' ? '🍎 Харчування' : '🧩 Інше'}
                          </span>
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

              {/* Custom SVG Bar Chart */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title">Статистика виконання (Відмітки)</h3>
                
                <div className="chart-svg-container" style={{ marginTop: '20px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 150">
                    {/* Y Axis Gridlines */}
                    <line x1="30" y1="20" x2="280" y2="20" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="30" y1="70" x2="280" y2="70" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="30" y1="120" x2="280" y2="120" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="4" />
                    
                    {/* X Axis Line */}
                    <line x1="30" y1="130" x2="280" y2="130" stroke="var(--text-muted)" strokeWidth="1.5" />
                    
                    {/* Bars */}
                    {/* 1. Daily completions count */}
                    <rect 
                      x="70" 
                      y={130 - Math.min(100, stats.completions_count * 5)} 
                      width="40" 
                      height={Math.min(100, stats.completions_count * 5)} 
                      className="chart-svg-bar" 
                      style={{ fill: 'var(--accent-primary)' }}
                    />
                    <text x="90" y="145" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Виконано</text>
                    <text x="90" y={120 - Math.min(100, stats.completions_count * 5)} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-heading)">
                      {stats.completions_count}
                    </text>

                    {/* 2. Total active habits count */}
                    <rect 
                      x="180" 
                      y={130 - Math.min(100, stats.habits_count * 15)} 
                      width="40" 
                      height={Math.min(100, stats.habits_count * 15)} 
                      className="chart-svg-bar" 
                      style={{ fill: '#14b8a6' }}
                    />
                    <text x="200" y="145" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Звички</text>
                    <text x="200" y={120 - Math.min(100, stats.habits_count * 15)} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-heading)">
                      {stats.habits_count}
                    </text>
                  </svg>
                </div>

                <div style={{ marginTop: '15px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Ви виконали <b>{stats.completions_count}</b> завдань серед ваших <b>{stats.habits_count}</b> активних звичок.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: ABOUT / GUIDE */}
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
          </div>
        )}

      </main>

      {/* MODAL 1: Create / Edit Habit */}
      {showHabitModal && (
        <div className="modal-backdrop" onClick={() => setShowHabitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>
              {editingHabit ? "Редагувати звичку" : "Створити нову звичку"}
            </h2>

            <form onSubmit={handleHabitSubmit}>
              <div className="form-group">
                <label className="form-label">Назва звички</label>
                <input 
                  type="text" 
                  className="form-input"
                  required
                  placeholder="напр., Ранкова пробіжка"
                  value={habitForm.title}
                  onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Опис (опціонально)</label>
                <textarea 
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="напр., Пробігти 5 кілометрів"
                  value={habitForm.description}
                  onChange={(e) => setHabitForm({ ...habitForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Періодичність</label>
                <select 
                  className="form-input form-select"
                  value={habitForm.frequency}
                  onChange={(e) => setHabitForm({ ...habitForm, frequency: e.target.value as 'daily' | 'weekly' })}
                >
                  <option value="daily">Щодня</option>
                  <option value="weekly">Щотижня</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label className="form-label">Категорія (Режим)</label>
                <select 
                  className="form-input form-select"
                  value={habitForm.category}
                  onChange={(e) => setHabitForm({ ...habitForm, category: e.target.value as any })}
                >
                  <option value="study">📚 Навчання (Study)</option>
                  <option value="sport">🏃 Спорт (Sport)</option>
                  <option value="sleep">😴 Сон (Sleep)</option>
                  <option value="nutrition">🍎 Харчування (Nutrition)</option>
                  <option value="other">🧩 Інше (Other)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowHabitModal(false)}>
                  Скасувати
                </button>
                <button type="submit" className="primary-btn">
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Weekly Report Summary */}
      {showWeeklyReport && stats && (
        <div className="modal-backdrop" onClick={() => setShowWeeklyReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)', textAlign: 'center' }}>
              📊 Щотижневий звіт продуктивності
            </h2>

            <div className="weekly-report-body">
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)' }}>
                    {stats.weekly_report.this_week_completions}
                  </span>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Цей тиждень</p>
                </div>
                <div>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-muted)' }}>
                    {stats.weekly_report.last_week_completions}
                  </span>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Минулий тиждень</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className={`growth-indicator ${
                  stats.weekly_report.growth_rate > 0 ? 'growth-up' : 
                  stats.weekly_report.growth_rate < 0 ? 'growth-down' : 'growth-stable'
                }`}>
                  {stats.weekly_report.growth_rate > 0 ? "📈" : stats.weekly_report.growth_rate < 0 ? "📉" : "➡️"} 
                  {stats.weekly_report.growth_rate > 0 ? `+${stats.weekly_report.growth_rate}%` : `${stats.weekly_report.growth_rate}%`}
                </div>
              </div>

              <div className="report-recommendation">
                {stats.weekly_report.message}
              </div>

              <button 
                className="primary-btn" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} 
                onClick={() => setShowWeeklyReport(false)}
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
