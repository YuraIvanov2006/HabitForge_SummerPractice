// frontend/src/components/EmptyState.tsx
// Friendly empty-state placeholder component shown when there is no data to display.

type EmptyStateType = 'no-habits' | 'no-data' | 'no-analytics';

interface EmptyStateProps {
  type: EmptyStateType;
  onCTA?: () => void;
}

const EMPTY_CONFIGS: Record<EmptyStateType, {
  icon: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
}> = {
  'no-habits': {
    icon: '🌱',
    title: 'Поки що немає звичок',
    subtitle: 'Додайте першу звичку та почніть будувати свою екосистему!',
    ctaLabel: 'Створити першу звичку',
  },
  'no-data': {
    icon: '📊',
    title: 'Немає даних для відображення',
    subtitle: 'Виконуйте звички, щоб побачити свою активність на тепловій карті.',
  },
  'no-analytics': {
    icon: '📈',
    title: 'Починайте відстежувати!',
    subtitle: 'Аналітика з\'явиться після перших виконань. Відзначте звичку як виконану сьогодні!',
  },
};

export default function EmptyState({ type, onCTA }: EmptyStateProps) {
  const config = EMPTY_CONFIGS[type];

  return (
    <div className="empty-state">
      <div className="empty-state-icon">{config.icon}</div>
      <h3 className="empty-state-title">{config.title}</h3>
      <p className="empty-state-subtitle">{config.subtitle}</p>
      {config.ctaLabel && onCTA && (
        <button className="primary-btn empty-state-cta" onClick={onCTA}>
          {config.ctaLabel}
        </button>
      )}
    </div>
  );
}
