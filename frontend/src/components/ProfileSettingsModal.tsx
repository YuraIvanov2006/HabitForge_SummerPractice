// frontend/src/components/ProfileSettingsModal.tsx
// Profile settings modal with tabs: Profile (edit username/email),
// Security (change password), and Account (delete account).
import React, { useState } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface ProfileSettingsModalProps {
  show: boolean;
  user: User;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
  onAccountDeleted: () => void;
  fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  triggerToast: (message: string, type?: string) => void;
}

type SettingsTab = 'profile' | 'security' | 'account';

export default function ProfileSettingsModal({
  show,
  user,
  onClose,
  onProfileUpdated,
  onAccountDeleted,
  fetchWithAuth,
  triggerToast,
}: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: user.username,
    email: user.email,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Account deletion state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!show) return null;

  // ── Profile Update ───────────────────────────────────────────────────────

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileLoading(true);

    try {
      const payload: Record<string, string> = {};
      if (profileForm.username !== user.username) payload.username = profileForm.username;
      if (profileForm.email !== user.email) payload.email = profileForm.email;

      if (Object.keys(payload).length === 0) {
        triggerToast('Нічого не змінилося.', 'info');
        setProfileLoading(false);
        return;
      }

      const res = await fetchWithAuth('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (!res) return;
      if (!res.ok) {
        const body = await res.json();
        const detail = body?.detail;
        setProfileError(typeof detail === 'string' ? detail : 'Не вдалося оновити профіль.');
        return;
      }

      const updated: User = await res.json();
      onProfileUpdated(updated);
      triggerToast('Профіль успішно оновлено! ✅', 'success');
      onClose();
    } catch {
      setProfileError('Помилка мережі. Спробуйте пізніше.');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Password Change ──────────────────────────────────────────────────────

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Нові паролі не збігаються.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Новий пароль повинен містити щонайменше 8 символів.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetchWithAuth('/api/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }),
      });

      if (!res) return;
      if (!res.ok) {
        const body = await res.json();
        const detail = body?.detail;
        setPasswordError(typeof detail === 'string' ? detail : 'Не вдалося змінити пароль.');
        return;
      }

      triggerToast('Пароль успішно змінено! 🔒', 'success');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      onClose();
    } catch {
      setPasswordError('Помилка мережі. Спробуйте пізніше.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Account Deletion ─────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user.username) return;
    setDeleteLoading(true);
    try {
      const res = await fetchWithAuth('/api/users/me', { method: 'DELETE' });
      if (res === null || res.status === 204) {
        triggerToast('Акаунт видалено. До побачення!', 'info');
        onAccountDeleted();
      } else {
        triggerToast('Не вдалося видалити акаунт.', 'error');
      }
    } catch {
      triggerToast('Помилка мережі.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content profile-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="profile-modal-header">
          <h3 className="card-title" style={{ fontSize: 20 }}>⚙️ Налаштування профілю</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Закрити">×</button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {(['profile', 'security', 'account'] as SettingsTab[]).map((tab) => (
            <button
              key={tab}
              className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); setProfileError(''); setPasswordError(''); }}
            >
              {tab === 'profile' && '👤 Профіль'}
              {tab === 'security' && '🔒 Безпека'}
              {tab === 'account' && '🗑️ Акаунт'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-tab-content">

          {/* ── Profile Tab ─────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              {profileError && (
                <div className="form-error-banner">⚠️ {profileError}</div>
              )}
              <div className="form-group">
                <label className="form-label">Ім'я користувача</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.username}
                  minLength={3}
                  maxLength={64}
                  required
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Електронна пошта</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  required
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="secondary-btn" onClick={onClose}>Скасувати</button>
                <button type="submit" className="primary-btn" disabled={profileLoading}>
                  {profileLoading ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          )}

          {/* ── Security Tab ─────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit}>
              {passwordError && (
                <div className="form-error-banner">⚠️ {passwordError}</div>
              )}
              <div className="form-group">
                <label className="form-label">Поточний пароль</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="••••••••"
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Новий пароль</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="Мінімум 8 символів"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Підтвердження нового паролю</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="Повторіть новий пароль"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="secondary-btn" onClick={onClose}>Скасувати</button>
                <button type="submit" className="primary-btn" disabled={passwordLoading}>
                  {passwordLoading ? 'Зміна...' : 'Змінити пароль'}
                </button>
              </div>
            </form>
          )}

          {/* ── Account Tab ──────────────────────────────────────────────── */}
          {activeTab === 'account' && (
            <div>
              <div className="danger-zone-card">
                <h4 style={{ color: '#ef4444', marginBottom: 8, fontWeight: 700 }}>⚠️ Небезпечна зона</h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  Видалення акаунту є <strong>незворотною</strong> дією. Усі ваші звички, журнали
                  виконання та прогрес будуть безповоротно видалені.
                </p>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">
                    Введіть ваше ім'я користувача (<strong>{user.username}</strong>) для підтвердження:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={user.username}
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                  />
                </div>
                <button
                  className="danger-btn"
                  disabled={deleteConfirm !== user.username || deleteLoading}
                  onClick={handleDeleteAccount}
                >
                  {deleteLoading ? 'Видалення...' : '🗑️ Назавжди видалити акаунт'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
