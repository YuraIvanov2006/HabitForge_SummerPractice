"""
app/api/reports.py
──────────────────
Dedicated report endpoints built on the stats service.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.stats import WeeklyReportSummary
from app.services.stats_service import get_user_stats

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get(
    "/weekly",
    response_model=WeeklyReportSummary,
    summary="Get detailed weekly habit report",
)
async def get_weekly_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WeeklyReportSummary:
    """
    Return an extended weekly summary including habit counts, streaks,
    per-day completion breakdown, and upcoming due dates.
    """
    stats = await get_user_stats(db, current_user.id)
    return stats.weekly_report
