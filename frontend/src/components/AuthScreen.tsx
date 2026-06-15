import React, { useState } from 'react';

interface AuthScreenProps {
  apiBase: string;
  onLoginSuccess: (token: string, refreshToken?: string) => void;
  triggerToast: (message: string, type?: string) => void;
  parseApiError: (detail: unknown) => string;
}

export default function AuthScreen({
  apiBase,
  onLoginSuccess,
  triggerToast,
  parseApiError,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        const res = await fetch(`${apiBase}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: authForm.username,
            email: authForm.email,
            password: authForm.password
          })
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(parseApiError(body.detail));
        }
        setAuthMode('login');
        triggerToast("Акаунт створено успішно! Будь ласка, увійдіть.", "success");
      } else {
        const params = new URLSearchParams();
        params.append('username', authForm.email);
        params.append('password', authForm.password);

        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(parseApiError(body.detail) || "Невірний email або пароль");
        }
        const data = await res.json();
        onLoginSuccess(data.access_token, data.refresh_token);
      }
    } catch (err: any) {
      setAuthError(err.message || "Помилка сервера. Спробуйте пізніше.");
    }
  };

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
            <label className="form-label">
              {authMode === 'login' ? 'Email або Ім\'я' : 'Електронна пошта'}
            </label>
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
              minLength={authMode === 'register' ? 8 : undefined}
              maxLength={authMode === 'register' ? 128 : undefined}
              placeholder="••••••••"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
            {authMode === 'register' && (
              <p className="form-hint">8–128 символів. Літери, цифри та спецсимволи дозволені.</p>
            )}
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
