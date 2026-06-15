import { useState, useEffect } from 'react';
import EmptyState from './EmptyState';

type HeatmapRange = "week" | "month" | "6months";

interface HeatmapCell {
  date: string | null;
  intensity: number;
  completions: number;
  variant: "active" | "padding" | "future";
}

interface MonthLabel {
  label: string;
  column: number;
}

interface HeatmapModel {
  cells: HeatmapCell[];
  weekCount: number;
  monthLabels: MonthLabel[];
  startDate: string;
  endDate: string;
  totalCompletions: number;
  activeDays: number;
}

interface HeatmapProps {
  focusMode: string;
  effectiveDate: string;
  fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
}

const HEATMAP_RANGE_CONFIG: Record<HeatmapRange, { days: number; label: string; shortLabel: string }> = {
  week: { days: 7, label: "Тиждень", shortLabel: "7 дн." },
  month: { days: 30, label: "Місяць", shortLabel: "30 дн." },
  "6months": { days: 182, label: "6 місяців", shortLabel: "6 міс." },
};

const HEATMAP_DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export default function Heatmap({
  focusMode,
  effectiveDate,
  fetchWithAuth,
}: HeatmapProps) {
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRange>("6months");
  const [data, setData] = useState<HeatmapModel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadHeatmap() {
      setLoading(true);
      try {
        const categoryQuery = focusMode !== "all" ? `&category=${focusMode}` : "";
        const res = await fetchWithAuth(`/api/stats/heatmap?range=${heatmapRange}${categoryQuery}`);
        if (res && res.ok && active) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to load heatmap:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHeatmap();
    return () => {
      active = false;
    };
  }, [heatmapRange, focusMode, effectiveDate, fetchWithAuth]);

  if (!data) {
    return <div className="card heatmap-card"><p style={{ color: 'var(--text-muted)' }}>Завантаження теплової карти...</p></div>;
  }

  if (data.totalCompletions === 0) {
    return (
      <div className="card heatmap-card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>Теплова карта активності</h3>
        <EmptyState type="no-data" />
      </div>
    );
  }

  return (
    <div className="card heatmap-card">
      <div className="heatmap-card-header">
        <div className="heatmap-card-title">
          <h3 className="card-title">Теплова карта активності</h3>
          <p className="heatmap-subtitle">
            {focusMode === "all" ? "Усі звички" : `Фокус: ${focusMode}`}
            {" · "}
            {data.startDate} — {data.endDate}
          </p>
        </div>
        <div className="heatmap-range-selector" role="group" aria-label="Період heatmap">
          {(Object.keys(HEATMAP_RANGE_CONFIG) as HeatmapRange[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`heatmap-range-btn ${heatmapRange === key ? "active" : ""}`}
              onClick={() => setHeatmapRange(key)}
            >
              {HEATMAP_RANGE_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="heatmap-summary">
        <span><b>{data.totalCompletions}</b> виконань</span>
        <span><b>{data.activeDays}</b> активних днів</span>
        {loading && <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Оновлення...</span>}
      </div>

      <div className="heatmap-layout" data-range={heatmapRange}>
        <div className="heatmap-day-labels" aria-hidden="true">
          {HEATMAP_DAY_LABELS.map((label, idx) => (
            <span key={label} className={idx % 2 === 0 ? "is-visible" : ""}>
              {label}
            </span>
          ))}
        </div>

        <div className="heatmap-scroll-container">
          {heatmapRange !== "week" && data.monthLabels.length > 0 && (
            <div
              className="heatmap-month-row"
              style={{ gridTemplateColumns: `repeat(${data.weekCount}, var(--heatmap-cell-size))` }}
            >
              {data.monthLabels.map((m) => (
                <span
                  key={`${m.label}-${m.column}`}
                  className="heatmap-month-label"
                  style={{ gridColumn: `${m.column + 1}` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          )}

          <div
            className="heatmap-grid"
            data-range={heatmapRange}
            style={{ gridTemplateColumns: `repeat(${data.weekCount}, var(--heatmap-cell-size))` }}
          >
            {data.cells.map((cell, idx) => (
              <div
                key={`${cell.date ?? "pad"}-${idx}`}
                className={`heatmap-cell heatmap-cell--${cell.variant}`}
                data-count={cell.variant === "active" ? cell.intensity : undefined}
                aria-label={
                  cell.date
                    ? `${cell.date}: ${cell.completions} виконань`
                    : undefined
                }
              >
                {cell.date && (
                  <span className="tooltip">
                    {cell.date}: {cell.completions}{" "}
                    {cell.completions === 1 ? "виконання" : "виконань"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-labels">
        <span>Менше</span>
        <div className="heatmap-legend">
          <div className="heatmap-cell" data-count="0" />
          <div className="heatmap-cell" data-count="1" />
          <div className="heatmap-cell" data-count="2" />
          <div className="heatmap-cell" data-count="3" />
          <div className="heatmap-cell" data-count="4" />
        </div>
        <span>Більше</span>
      </div>
    </div>
  );
}
