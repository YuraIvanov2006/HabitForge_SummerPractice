// frontend/src/components/Skeleton.tsx
// Reusable skeleton loading components with shimmer animation.

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

/** Base skeleton block with shimmer animation. */
export function SkeletonBlock({ width = '100%', height = '16px', borderRadius = '8px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-block ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a single stat metric card. */
export function SkeletonMetricCard() {
  return (
    <div className="card metric-card skeleton-card" aria-hidden="true">
      <div className="skeleton-block" style={{ width: 48, height: 48, borderRadius: 8 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton-block" style={{ width: '60%', height: 24, borderRadius: 6 }} />
        <div className="skeleton-block" style={{ width: '80%', height: 14, borderRadius: 6 }} />
      </div>
    </div>
  );
}

/** Skeleton for a single habit row. */
export function SkeletonHabitRow() {
  return (
    <div className="skeleton-habit-row" aria-hidden="true">
      <div className="skeleton-block" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton-block" style={{ width: '55%', height: 16, borderRadius: 6 }} />
        <div className="skeleton-block" style={{ width: '35%', height: 12, borderRadius: 6 }} />
      </div>
      <div className="skeleton-block" style={{ width: 80, height: 32, borderRadius: 8 }} />
    </div>
  );
}

/** Full dashboard loading skeleton shown on initial data fetch. */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-label="Завантаження...">
      {/* Header skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div className="skeleton-block" style={{ width: '40%', height: 36, borderRadius: 10, marginBottom: 12 }} />
        <div className="skeleton-block" style={{ width: '25%', height: 18, borderRadius: 6 }} />
      </div>

      {/* Stats bar skeleton */}
      <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="skeleton-block" style={{ width: 54, height: 54, borderRadius: 8 }} />
          <div className="skeleton-block" style={{ width: '30%', height: 18, borderRadius: 6 }} />
        </div>
        <div className="skeleton-block" style={{ width: '100%', height: 14, borderRadius: 99 }} />
      </div>

      {/* Metrics row skeleton */}
      <div className="metrics-row" style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => <SkeletonMetricCard key={i} />)}
      </div>

      {/* Habits list skeleton */}
      <div className="card">
        <div className="skeleton-block" style={{ width: '30%', height: 20, borderRadius: 6, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map(i => <SkeletonHabitRow key={i} />)}
        </div>
      </div>
    </div>
  );
}
