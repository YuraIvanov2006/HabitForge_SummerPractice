"""
app/utils/visuals.py
────────────────────
Helpers that build chart-ready data structures from raw habit/log data.
"""
from datetime import date, timedelta

from app.schemas.stats import (
    CategoryBarPoint,
    ChartData,
    TimeSeriesPoint,
    WeeklyComparisonPoint,
)

WEEKDAY_LABELS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


def build_completions_by_day(
    completed_dates: list[date],
    current_monday: date,
) -> dict[str, int]:
    """Count completions per weekday label for the current Mon–Sun window."""
    counts = {label: 0 for label in WEEKDAY_LABELS}
    week_end = current_monday + timedelta(days=6)
    for d in completed_dates:
        if current_monday <= d <= week_end:
            counts[WEEKDAY_LABELS[d.weekday()]] += 1
    return counts


def build_heatmap_grid(
    completed_dates: list[date],
    *,
    reference_date: date,
    days: int = 30,
) -> list[dict[str, int | str]]:
    """
    Build a daily completion grid for the past *days* ending on *reference_date*.

    Each entry contains ``date`` (ISO string) and ``intensity`` (completion count,
    0 when no completions). Ensures every calendar day in the window is present.
    """
    start = reference_date - timedelta(days=days - 1)
    counts: dict[date, int] = {}
    for d in completed_dates:
        if start <= d <= reference_date:
            counts[d] = counts.get(d, 0) + 1

    grid: list[dict[str, int | str]] = []
    cursor = start
    while cursor <= reference_date:
        grid.append(
            {
                "date": cursor.isoformat(),
                "intensity": counts.get(cursor, 0),
            }
        )
        cursor += timedelta(days=1)
    return grid


def build_chart_data(
    *,
    all_completed_dates: list[date],
    category_stats: dict[str, int],
    this_week_count: int,
    last_week_count: int,
    current_monday: date,
    reference_date: date,
    time_series_days: int = 14,
) -> ChartData:
    """Assemble chart payloads for the stats dashboard."""
    series_start = reference_date - timedelta(days=time_series_days - 1)
    daily_counts: dict[date, int] = {}
    for d in all_completed_dates:
        if series_start <= d <= reference_date:
            daily_counts[d] = daily_counts.get(d, 0) + 1

    completion_time_series: list[TimeSeriesPoint] = []
    cursor = series_start
    while cursor <= reference_date:
        completion_time_series.append(
            TimeSeriesPoint(date=cursor.isoformat(), count=daily_counts.get(cursor, 0))
        )
        cursor += timedelta(days=1)

    category_bar = [
        CategoryBarPoint(category=cat, xp=xp)
        for cat, xp in category_stats.items()
        if xp > 0
    ]
    category_bar.sort(key=lambda p: p.xp, reverse=True)

    iso_year, iso_week, _ = current_monday.isocalendar()
    this_week_label = f"{iso_year}-W{iso_week:02d}"
    last_monday = current_monday - timedelta(days=7)
    ly, lw, _ = last_monday.isocalendar()
    last_week_label = f"{ly}-W{lw:02d}"

    weekly_comparison = [
        WeeklyComparisonPoint(week=last_week_label, completions=last_week_count),
        WeeklyComparisonPoint(week=this_week_label, completions=this_week_count),
    ]

    return ChartData(
        completion_time_series=completion_time_series,
        category_bar=category_bar,
        weekly_comparison=weekly_comparison,
    )
