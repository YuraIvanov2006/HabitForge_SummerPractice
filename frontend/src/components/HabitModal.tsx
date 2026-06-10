import React from 'react';

interface Habit {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  frequency: "daily" | "weekly";
  category: "study" | "sport" | "sleep" | "nutrition" | "other";
  created_at: string;
}

interface HabitModalProps {
  show: boolean;
  editingHabit: Habit | null;
  habitForm: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekly';
    category: 'study' | 'sport' | 'sleep' | 'nutrition' | 'other';
  };
  setHabitForm: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    frequency: 'daily' | 'weekly';
    category: 'study' | 'sport' | 'sleep' | 'nutrition' | 'other';
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function HabitModal({
  show,
  editingHabit,
  habitForm,
  setHabitForm,
  onSubmit,
  onClose,
}: HabitModalProps) {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="card-title" style={{ fontSize: '20px', marginBottom: '20px' }}>
          {editingHabit ? "✏️ Редагувати звичку" : "🌱 Створити нову звичку"}
        </h3>
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Назва звички</label>
            <input 
              type="text" 
              className="form-input" 
              required
              placeholder="Наприклад: Читати 20 сторінок"
              value={habitForm.title}
              onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Опис / Нотатки</label>
            <textarea 
              className="form-input" 
              style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Короткий опис вашої мети..."
              value={habitForm.description}
              onChange={(e) => setHabitForm({ ...habitForm, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Періодичність виконання</label>
            <select 
              className="form-input form-select"
              value={habitForm.frequency}
              onChange={(e) => setHabitForm({ ...habitForm, frequency: e.target.value as any })}
            >
              <option value="daily">📅 Щодня (Daily)</option>
              <option value="weekly">📆 Щотижня (Weekly)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="form-label">Категорія</label>
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
            <button type="button" className="secondary-btn" onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className="primary-btn">
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
