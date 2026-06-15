// frontend/src/test/utils.test.ts
// Tests for shared utility functions: formatLocalDate and parseApiError
import { describe, it, expect } from 'vitest';

// ── Re-implement helpers here for isolated testing ──────────────────────────
// These mirror the implementations in App.tsx

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseApiError(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const fieldLabels: Record<string, string> = {
      password: 'Пароль',
      username: "Ім'я користувача",
      email: 'Email',
    };
    return detail
      .map((item: { msg?: string; loc?: (string | number)[] }) => {
        const field = String(item.loc?.slice(-1)[0] ?? 'поле');
        const label = fieldLabels[field] ?? field;
        return `${label}: ${item.msg ?? 'невалідне значення'}`;
      })
      .join('. ');
  }
  return 'Помилка сервера. Спробуйте пізніше.';
}

// ── formatLocalDate tests ────────────────────────────────────────────────────

describe('formatLocalDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2025, 5, 15); // June 15, 2025
    expect(formatLocalDate(date)).toBe('2025-06-15');
  });

  it('zero-pads month and day', () => {
    const date = new Date(2024, 0, 5); // January 5, 2024
    expect(formatLocalDate(date)).toBe('2024-01-05');
  });

  it('handles December correctly', () => {
    const date = new Date(2023, 11, 31); // December 31, 2023
    expect(formatLocalDate(date)).toBe('2023-12-31');
  });

  it('handles leap year date', () => {
    const date = new Date(2024, 1, 29); // February 29, 2024
    expect(formatLocalDate(date)).toBe('2024-02-29');
  });
});

// ── parseApiError tests ──────────────────────────────────────────────────────

describe('parseApiError', () => {
  it('returns string detail as-is', () => {
    expect(parseApiError('Incorrect email or password.')).toBe(
      'Incorrect email or password.'
    );
  });

  it('returns fallback for unknown types', () => {
    expect(parseApiError(null)).toBe('Помилка сервера. Спробуйте пізніше.');
    expect(parseApiError(42)).toBe('Помилка сервера. Спробуйте пізніше.');
    expect(parseApiError({})).toBe('Помилка сервера. Спробуйте пізніше.');
  });

  it('formats pydantic validation array errors with field labels', () => {
    const detail = [
      { msg: 'too short', loc: ['body', 'password'] },
      { msg: 'not a valid email', loc: ['body', 'email'] },
    ];
    const result = parseApiError(detail);
    expect(result).toContain('Пароль: too short');
    expect(result).toContain('Email: not a valid email');
  });

  it('handles array items with unknown fields', () => {
    const detail = [{ msg: 'required', loc: ['body', 'someField'] }];
    const result = parseApiError(detail);
    expect(result).toBe('someField: required');
  });

  it('handles missing loc gracefully', () => {
    const detail = [{ msg: 'required' }];
    const result = parseApiError(detail);
    expect(result).toContain('поле: required');
  });
});
