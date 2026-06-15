// frontend/src/test/HabitModal.test.tsx
// Tests for HabitModal — create/edit habit form behavior
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HabitModal from '../components/HabitModal';

const mockHabit = {
  id: 1,
  user_id: 1,
  title: 'Read 20 pages',
  description: 'Reading every day',
  frequency: 'daily' as const,
  category: 'study' as const,
  created_at: '2025-01-01T00:00:00Z',
};

const defaultForm = {
  title: '',
  description: '',
  frequency: 'daily' as const,
  category: 'study' as const,
};

describe('HabitModal', () => {
  const mockSetHabitForm = vi.fn();
  const mockOnSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Visibility ───────────────────────────────────────────────────────────

  it('renders nothing when show=false', () => {
    const { container } = render(
      <HabitModal
        show={false}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when show=true', () => {
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText(/Створити нову звичку/i)).toBeInTheDocument();
  });

  // ── Create Mode ──────────────────────────────────────────────────────────

  it('shows create title when editingHabit is null', () => {
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText(/Створити нову звичку/i)).toBeInTheDocument();
  });

  it('renders all form fields in create mode', () => {
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByPlaceholderText(/Наприклад: Читати/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Короткий опис/i)).toBeInTheDocument();
    // Frequency and category selects
    expect(screen.getByText(/Щодня/i)).toBeInTheDocument();
    expect(screen.getByText(/Навчання/i)).toBeInTheDocument();
  });

  // ── Edit Mode ────────────────────────────────────────────────────────────

  it('shows edit title when editingHabit is provided', () => {
    render(
      <HabitModal
        show={true}
        editingHabit={mockHabit}
        habitForm={{
          title: mockHabit.title,
          description: mockHabit.description,
          frequency: mockHabit.frequency,
          category: mockHabit.category,
        }}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText(/Редагувати звичку/i)).toBeInTheDocument();
  });

  it('pre-fills form with habit data in edit mode', () => {
    render(
      <HabitModal
        show={true}
        editingHabit={mockHabit}
        habitForm={{
          title: 'Read 20 pages',
          description: 'Reading every day',
          frequency: 'daily',
          category: 'study',
        }}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    const titleInput = screen.getByPlaceholderText(/Наприклад: Читати/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Read 20 pages');
  });

  // ── Interactions ─────────────────────────────────────────────────────────

  it('calls onClose when the backdrop is clicked', () => {
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    const backdrop = document.querySelector('.modal-backdrop') as HTMLElement;
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole('button', { name: /Скасувати/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when the Save button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={{ ...defaultForm, title: 'My habit' }}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole('button', { name: /Зберегти/i }));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls setHabitForm when title input changes', async () => {
    const user = userEvent.setup();
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    const titleInput = screen.getByPlaceholderText(/Наприклад: Читати/i);
    await user.type(titleInput, 'A');
    expect(mockSetHabitForm).toHaveBeenCalled();
  });

  // ── Category Options ─────────────────────────────────────────────────────

  it('renders all 5 category options', () => {
    render(
      <HabitModal
        show={true}
        editingHabit={null}
        habitForm={defaultForm}
        setHabitForm={mockSetHabitForm}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText(/Навчання/i)).toBeInTheDocument();
    expect(screen.getByText(/Спорт/i)).toBeInTheDocument();
    expect(screen.getByText(/Сон/i)).toBeInTheDocument();
    expect(screen.getByText(/Харчування/i)).toBeInTheDocument();
    expect(screen.getByText(/Інше/i)).toBeInTheDocument();
  });
});
