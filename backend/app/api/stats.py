"""
app/api/stats.py
────────────────
Endpoints for calculating user statistics, streaks, and gamification level growth.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.stats import StatsResponse
from app.services.stats_service import get_user_stats

router = APIRouter(prefix="/api/stats", tags=["Statistics & Gamification"])


@router.get(
    "/",
    response_model=StatsResponse,
    summary="Get user productivity stats, streaks, XP, and weekly report",
)
async def read_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StatsResponse:
    """
    Calculate and return the user's progress stats.

    XP calculation rules:
      - Daily habit completion: +10 XP
      - Weekly habit completion: +30 XP
      - Streak bonus: +10 XP per day of maximum current daily streak

    Progression levels:
      - Level = 1 + floor(XP / 100)
      - Stage = min(5, XP // 300)
    """
    return await get_user_stats(db, current_user.id)
