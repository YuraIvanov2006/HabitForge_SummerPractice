"""
app/schemas/stats.py
────────────────────
Pydantic schemas for the /api/stats endpoint responses.
"""
from pydantic import BaseModel, Field


class WeeklyReportSummary(BaseModel):
    this_week_completions: int = Field(..., description="Number of completions in the current week (Mon-Sun)")
    last_week_completions: int = Field(..., description="Number of completions in the previous week (Mon-Sun)")
    growth_rate: float = Field(..., description="Percentage growth/shrinkage of completions compared to last week")
    message: str = Field(..., description="A motivational phrase or recommendation")


class StatsResponse(BaseModel):
    total_xp: int = Field(..., description="Total accumulated experience points")
    level: int = Field(..., description="Calculated user level (1 + floor(XP / 100))")
    xp_progress: int = Field(..., description="XP progress percentage (0-99) inside the current level")
    tree_stage: int = Field(..., description="Growth stage of the progress tree (0 to 5)")
    tree_stage_name: str = Field(..., description="Name of the tree stage (Seed, Sprout, Sapling, etc.)")
    streak_current: int = Field(..., description="Maximum current streak among all daily habits")
    streak_longest: int = Field(..., description="Maximum longest streak among all daily habits")
    habits_count: int = Field(..., description="Total number of habits created by the user")
    completions_count: int = Field(..., description="Total number of completions logged")
    completion_rate: float = Field(..., description="Overall completion percentage (0.0 to 100.0)")
    category_stats: dict[str, int] = Field(..., description="XP breakdown by category (study, sport, sleep, nutrition, other)")
    weekly_report: WeeklyReportSummary = Field(..., description="Weekly summary comparing this week vs last week")
