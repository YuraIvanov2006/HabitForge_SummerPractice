// frontend/src/test/AuthScreen.test.tsx
// Tests for the AuthScreen component — login/register form behavior
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from '../components/AuthScreen';

// Mock helpers
const mockOnLoginSuccess = vi.fn();
const mockTriggerToast = vi.fn();
const mockParseApiError = (detail: unknown): string => {
  if (typeof detail === 'string') return detail;
  return 'Помилка сервера.';
};

const defaultProps = {
  apiBase: 'http://localhost:8000',
  onLoginSuccess: mockOnLoginSuccess,
  triggerToast: mockTriggerToast,
  parseApiError: mockParseApiError,
};

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders the login form by default', () => {
    render(<AuthScreen {...defaultProps} />);
    expect(screen.getByText('З поверненням!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /увійти/i })).toBeInTheDocument();
  });

  it('shows the HabitForge brand', () => {
    render(<AuthScreen {...defaultProps} />);
    expect(screen.getByText('HabitForge')).toBeInTheDocument();
  });

  it('does not show username field in login mode', () => {
    render(<AuthScreen {...defaultProps} />);
    expect(screen.queryByPlaceholderText('john_doe')).not.toBeInTheDocument();
  });

  // ── Mode Switching ───────────────────────────────────────────────────────

  it('switches to register mode when clicking the register link', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    await user.click(screen.getByText('Зареєструватися'));

    expect(screen.getByText('Створіть акаунт')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('john_doe')).toBeInTheDocument();
  });

  it('switches back to login mode from register', async () => {
    const user = userEvent.setup();
    render(<AuthScreen {...defaultProps} />);

    // Go to register
    await user.click(screen.getByText('Зареєструватися'));
    expect(screen.getByText('Створіть акаунт')).toBeInTheDocument();

    // Go back to login
    await user.click(screen.getByText('Увійти'));
    expect(screen.getByText('З поверненням!')).toBeInTheDocument();
  });

  // ── Login Flow ───────────────────────────────────────────────────────────

  it('calls onLoginSuccess with the access token on successful login', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'test-access-token', refresh_token: 'test-refresh' }),
    } as Response);

    render(<AuthScreen {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('email@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /увійти/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith('test-access-token', 'test-refresh');
    });
  });

  it('shows error message when login fails', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Incorrect email or password.' }),
    } as Response);

    render(<AuthScreen {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('email@example.com'), 'bad@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /увійти/i }));

    await waitFor(() => {
      expect(screen.getByText(/Incorrect email or password/i)).toBeInTheDocument();
    });

    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  // ── Register Flow ────────────────────────────────────────────────────────

  it('switches to login mode and shows toast after successful registration', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, username: 'testuser', email: 'test@example.com', created_at: '' }),
    } as Response);

    render(<AuthScreen {...defaultProps} />);

    // Switch to register
    await user.click(screen.getByText('Зареєструватися'));

    await user.type(screen.getByPlaceholderText('john_doe'), 'newuser');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'strongpass123');
    await user.click(screen.getByRole('button', { name: /зареєструватися/i }));

    await waitFor(() => {
      expect(mockTriggerToast).toHaveBeenCalledWith(
        expect.stringContaining('Акаунт створено'),
        'success'
      );
    });

    expect(screen.getByText('З поверненням!')).toBeInTheDocument();
  });

  it('shows error on register API failure', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'This username is already taken.' }),
    } as Response);

    render(<AuthScreen {...defaultProps} />);
    await user.click(screen.getByText('Зареєструватися'));

    await user.type(screen.getByPlaceholderText('john_doe'), 'existinguser');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'x@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /зареєструватися/i }));

    await waitFor(() => {
      expect(screen.getByText(/This username is already taken/i)).toBeInTheDocument();
    });
  });
});
