"""
app/api/stats.py
────────────────
Endpoints for calculating user statistics, streaks, and gamification level growth.
"""
from datetime import date, timedelta
from typing import Dict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.crud.habit import get_habits_by_user
from app.models.user import User
from app.schemas.stats import StatsResponse, WeeklyReportSummary

router = APIRouter(prefix="/api/stats", tags=["Statistics & Gamification"])


@router.get(
    "/",
    response_model=StatsResponse,
    summary="Get user productivity stats, streaks, XP, and weekly report",
)
async def get_user_stats(
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
    habits = await get_habits_by_user(db, current_user.id)

    total_completions = 0
    daily_completions = 0
    weekly_completions = 0

    max_current_streak = 0
    max_longest_streak = 0

    category_stats: Dict[str, int] = {
        "study": 0,
        "sport": 0,
        "sleep": 0,
        "nutrition": 0,
        "other": 0,
    }

    # Helper for streaks
    today = date.today()

    # Lists for weekly report comparison
    # We define the weeks relative to the current Monday
    current_monday = today - timedelta(days=today.weekday())
    last_monday = current_monday - timedelta(days=7)

    this_week_count = 0
    last_week_count = 0

    total_expected_completions = 0

    for habit in habits:
        completed_dates = sorted(
            [log.execution_date for log in habit.logs if log.is_completed]
        )
        total_completions += len(completed_dates)

        # Category mapping count
        cat = habit.category if habit.category in category_stats else "other"

        # Expected completions (approximate for completion rate calculation)
        days_active = (today - habit.created_at.date()).days + 1
        days_active = max(1, days_active)

        if habit.frequency == "daily":
            daily_completions += len(completed_dates)
            category_stats[cat] += len(completed_dates) * 10
            total_expected_completions += days_active

            # Calculate streaks for daily habits
            if completed_dates:
                # Set of dates for O(1) lookup
                date_set = set(completed_dates)

                # Current Streak
                curr_streak = 0
                check_date = today
                if check_date not in date_set:
                    # If not done today, check if done yesterday to see if streak is still active
                    check_date = today - timedelta(days=1)

                while check_date in date_set:
                    curr_streak += 1
                    check_date -= timedelta(days=1)
                max_current_streak = max(max_current_streak, curr_streak)

                # Longest Streak
                longest_streak = 0
                temp_streak = 0
                prev_date = None

                for d in completed_dates:
                    if prev_date is None:
                        temp_streak = 1
                    elif (d - prev_date).days == 1:
                        temp_streak += 1
                    elif (d - prev_date).days > 1:
                        longest_streak = max(longest_streak, temp_streak)
                        temp_streak = 1
                    prev_date = d
                longest_streak = max(longest_streak, temp_streak)
                max_longest_streak = max(max_longest_streak, longest_streak)

        elif habit.frequency == "weekly":
            weekly_completions += len(completed_dates)
            category_stats[cat] += len(completed_dates) * 30
            # A weekly habit is expected once per 7 active days
            total_expected_completions += max(1, days_active // 7)

        # Weekly report counts
        for d in completed_dates:
            if current_monday <= d <= current_monday + timedelta(days=6):
                this_week_count += 1
            elif last_monday <= d <= last_monday + timedelta(days=6):
                last_week_count += 1

    # Add streak bonus to category stats based on habit category with max streak
    # For simplicity, we add max streak * 10 XP to the overall score
    streak_bonus = max_current_streak * 10
    total_xp = (daily_completions * 10) + (weekly_completions * 30) + streak_bonus

    # Calculate Level progression
    level = 1 + (total_xp // 100)
    xp_progress = total_xp % 100

    # Calculate ecosystem/tree stage (0 to 5)
    tree_stage = min(5, total_xp // 300)
    stage_names = {
        0: "Насіння (Seed)",
        1: "Пагінець (Sprout)",
        2: "Саджанець (Sapling)",
        3: "Молоде Дерево (Young Tree)",
        4: "Доросле Дерево (Mature Tree)",
        5: "Квітуча Екосистема (Blooming Ecosystem)",
    }
    tree_stage_name = stage_names.get(tree_stage, stage_names[0])

    # Overall completion rate
    if total_expected_completions > 0:
        completion_rate = round(
            min(100.0, (total_completions / total_expected_completions) * 100.0), 1
        )
    else:
        completion_rate = 0.0

    # Weekly report calculations
    if last_week_count == 0:
        growth_rate = 100.0 if this_week_count > 0 else 0.0
    else:
        growth_rate = round(
            ((this_week_count - last_week_count) / last_week_count) * 100.0, 1
        )

    if growth_rate > 0:
        message = (
            f"Чудово! Ви виконали на {this_week_count - last_week_count} "
            f"звичок більше, ніж минулого тижня. Продовжуйте в тому ж дусі! 🚀"
        )
    elif growth_rate == 0 and this_week_count > 0:
        message = "Ви тримаєте чудовий стабільний темп. Так тримати! 🎯"
    elif growth_rate == 0 and this_week_count == 0:
        message = "Спробуйте виконати хоча б одну звичку сьогодні, щоб започаткувати свій прогрес! 🌱"
    else:
        message = (
            f"Цей тиждень виявився трохи пасивнішим (на {last_week_count - this_week_count} "
            f"звичок менше). Але кожен новий день — це чудовий шанс почати знову! 💪"
        )

    weekly_report = WeeklyReportSummary(
        this_week_completions=this_week_count,
        last_week_completions=last_week_count,
        growth_rate=growth_rate,
        message=message,
    )

    return StatsResponse(
        total_xp=total_xp,
        level=level,
        xp_progress=xp_progress,
        tree_stage=tree_stage,
        tree_stage_name=tree_stage_name,
        streak_current=max_current_streak,
        streak_longest=max_longest_streak,
        habits_count=len(habits),
        completions_count=total_completions,
        completion_rate=completion_rate,
        category_stats=category_stats,
        weekly_report=weekly_report,
    )
