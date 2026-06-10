"""
app/schemas/stats.py
────────────────────
Pydantic schemas for stats and report endpoint responses.
"""
from pydantic import BaseModel, Field


class HabitCounts(BaseModel):
    total: int = Field(..., description="Total number of habits")
    daily: int = Field(..., description="Number of daily habits")
    weekly: int = Field(..., description="Number of weekly habits")


class UpcomingDueDate(BaseModel):
    habit_id: int
    title: str
    due_date: str = Field(..., description="ISO date (YYYY-MM-DD)")
    frequency: str


class WeeklyReportSummary(BaseModel):
    habit_counts: HabitCounts
    completed_this_week: int = Field(
        ..., description="Completions in the current calendar week (Mon–Sun)"
    )
    average_streak: float = Field(
        ..., description="Average current streak across daily habits"
    )
    longest_streak: int = Field(
        ..., description="Longest streak among all daily habits"
    )
    completions_by_day: dict[str, int] = Field(
        ..., description="Completion counts per weekday (Mon–Sun) for the current week"
    )
    upcoming_due_dates: list[UpcomingDueDate] = Field(
        default_factory=list,
        description="Habits not yet completed for their current due period",
    )
    this_week_completions: int = Field(
        ..., description="Number of completions in the current week (Mon–Sun)"
    )
    last_week_completions: int = Field(
        ..., description="Number of completions in the previous week (Mon–Sun)"
    )
    growth_rate: float = Field(
        ..., description="Percentage growth/shrinkage compared to last week"
    )
    message: str = Field(..., description="A motivational phrase or recommendation")


class TimeSeriesPoint(BaseModel):
    date: str
    count: int


class CategoryBarPoint(BaseModel):
    category: str
    xp: int


class WeeklyComparisonPoint(BaseModel):
    week: str
    completions: int


class ChartData(BaseModel):
    completion_time_series: list[TimeSeriesPoint] = Field(
        default_factory=list,
        description="Daily completion counts for charting",
    )
    category_bar: list[CategoryBarPoint] = Field(
        default_factory=list,
        description="XP breakdown by category for bar charts",
    )
    weekly_comparison: list[WeeklyComparisonPoint] = Field(
        default_factory=list,
        description="This week vs last week completion counts",
    )


class StatsResponse(BaseModel):
    total_xp: int = Field(..., description="Total accumulated experience points")
    level: int = Field(..., description="Calculated user level (1 + floor(XP / 100))")
    xp_progress: int = Field(
        ..., description="XP progress percentage (0-99) inside the current level"
    )
    tree_stage: int = Field(..., description="Growth stage of the progress tree (0 to 5)")
    tree_stage_name: str = Field(
        ..., description="Name of the tree stage (Seed, Sprout, Sapling, etc.)"
    )
    streak_current: int = Field(
        ..., description="Maximum current streak among all daily habits"
    )
    streak_longest: int = Field(
        ..., description="Maximum longest streak among all daily habits"
    )
    habits_count: int = Field(..., description="Total number of habits created by the user")
    completions_count: int = Field(..., description="Total number of completions logged")
    completion_rate: float = Field(
        ..., description="Overall completion percentage (0.0 to 100.0)"
    )
    category_stats: dict[str, int] = Field(
        ...,
        description="XP breakdown by category (study, sport, sleep, nutrition, other)",
    )
    weekly_report: WeeklyReportSummary = Field(
        ..., description="Weekly summary comparing this week vs last week"
    )
    chart_data: ChartData = Field(
        ..., description="Structured data for frontend charts and visualizations"
    )


class MonthLabel(BaseModel):
    label: str
    column: int


class HeatmapCellResponse(BaseModel):
    date: str | None = Field(None, description="ISO date (YYYY-MM-DD)")
    intensity: int = Field(..., description="Intensity value (0 to 4)")
    completions: int = Field(..., description="Completions count")
    variant: str = Field(..., description="active | padding | future")


class HeatmapResponse(BaseModel):
    cells: list[HeatmapCellResponse] = Field(default_factory=list)
    week_count: int = Field(..., alias="weekCount")
    month_labels: list[MonthLabel] = Field(default_factory=list, alias="monthLabels")
    start_date: str = Field(..., alias="startDate")
    end_date: str = Field(..., alias="endDate")
    total_completions: int = Field(..., alias="totalCompletions")
    active_days: int = Field(..., alias="activeDays")

    class Config:
        populate_by_name = True

