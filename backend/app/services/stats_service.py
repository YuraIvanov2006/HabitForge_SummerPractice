"""
app/services/stats_service.py
─────────────────────────────
User statistics, gamification, weekly reports, and chart data.
"""
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.state import get_current_date
from app.crud.habit import get_habits_by_user
from app.models.habit import Habit
from app.schemas.stats import (
    HabitCounts,
    StatsResponse,
    UpcomingDueDate,
    WeeklyReportSummary,
)
from app.utils.visuals import build_chart_data, build_completions_by_day

STAGE_NAMES = {
    0: "Насіння (Seed)",
    1: "Пагінець (Sprout)",
    2: "Саджанець (Sapling)",
    3: "Молоде Дерево (Young Tree)",
    4: "Доросле Дерево (Mature Tree)",
    5: "Квітуча Екосистема (Blooming Ecosystem)",
}

CATEGORY_KEYS = ("study", "sport", "sleep", "nutrition", "other")


def _calculate_current_streak(completed_dates: set[date], today: date) -> int:
    check_date = today
    if check_date not in completed_dates:
        check_date = today - timedelta(days=1)
    streak = 0
    while check_date in completed_dates:
        streak += 1
        check_date -= timedelta(days=1)
    return streak


def _calculate_longest_streak(completed_dates: list[date]) -> int:
    if not completed_dates:
        return 0
    longest = 1
    temp = 1
    prev = completed_dates[0]
    for d in completed_dates[1:]:
        if (d - prev).days == 1:
            temp += 1
        elif (d - prev).days > 1:
            longest = max(longest, temp)
            temp = 1
        prev = d
    return max(longest, temp)


def _week_growth_message(
    this_week_count: int, last_week_count: int, growth_rate: float
) -> str:
    if growth_rate > 0:
        return (
            f"Чудово! Ви виконали на {this_week_count - last_week_count} "
            f"звичок більше, ніж минулого тижня. Продовжуйте в тому ж дусі! 🚀"
        )
    if growth_rate == 0 and this_week_count > 0:
        return "Ви тримаєте чудовий стабільний темп. Так тримати! 🎯"
    if growth_rate == 0 and this_week_count == 0:
        return (
            "Спробуйте виконати хоча б одну звичку сьогодні, "
            "щоб започаткувати свій прогрес! 🌱"
        )
    return (
        f"Цей тиждень виявився трохи пасивнішим (на {last_week_count - this_week_count} "
        f"звичок менше). Але кожен новий день — це чудовий шанс почати знову! 💪"
    )


def _build_upcoming_due_dates(
    habits: list[Habit],
    today: date,
    current_monday: date,
) -> list[UpcomingDueDate]:
    upcoming: list[UpcomingDueDate] = []
    week_end = current_monday + timedelta(days=6)

    for habit in habits:
        completed_dates = {
            log.execution_date
            for log in habit.logs
            if log.is_completed
        }
        if habit.frequency == "daily":
            if today not in completed_dates:
                upcoming.append(
                    UpcomingDueDate(
                        habit_id=habit.id,
                        title=habit.title,
                        due_date=today.isoformat(),
                        frequency=habit.frequency,
                    )
                )
        elif habit.frequency == "weekly":
            completed_this_week = any(
                current_monday <= d <= week_end for d in completed_dates
            )
            if not completed_this_week:
                upcoming.append(
                    UpcomingDueDate(
                        habit_id=habit.id,
                        title=habit.title,
                        due_date=week_end.isoformat(),
                        frequency=habit.frequency,
                    )
                )
    return upcoming


def compute_user_stats(habits: list[Habit], today: date | None = None) -> StatsResponse:
    """Calculate full stats payload from pre-loaded habits (with logs)."""
    today = today or get_current_date()
    current_monday = today - timedelta(days=today.weekday())
    last_monday = current_monday - timedelta(days=7)

    total_completions = 0
    daily_completions = 0
    weekly_completions = 0
    max_current_streak = 0
    max_longest_streak = 0
    daily_streaks: list[int] = []
    all_completed_dates: list[date] = []

    category_stats: dict[str, int] = {k: 0 for k in CATEGORY_KEYS}
    this_week_count = 0
    last_week_count = 0
    total_expected_completions = 0
    daily_habit_count = 0
    weekly_habit_count = 0

    for habit in habits:
        if habit.frequency == "daily":
            daily_habit_count += 1
        elif habit.frequency == "weekly":
            weekly_habit_count += 1

        completed_dates = sorted(
            log.execution_date for log in habit.logs if log.is_completed
        )
        all_completed_dates.extend(completed_dates)
        total_completions += len(completed_dates)

        cat = habit.category if habit.category in category_stats else "other"
        days_active = max(1, (today - habit.created_at.date()).days + 1)

        if habit.frequency == "daily":
            daily_completions += len(completed_dates)
            category_stats[cat] += len(completed_dates) * 10
            total_expected_completions += days_active

            if completed_dates:
                date_set = set(completed_dates)
                curr = _calculate_current_streak(date_set, today)
                longest = _calculate_longest_streak(completed_dates)
                daily_streaks.append(curr)
                max_current_streak = max(max_current_streak, curr)
                max_longest_streak = max(max_longest_streak, longest)

        elif habit.frequency == "weekly":
            weekly_completions += len(completed_dates)
            category_stats[cat] += len(completed_dates) * 30
            total_expected_completions += max(1, days_active // 7)

        for d in completed_dates:
            if current_monday <= d <= current_monday + timedelta(days=6):
                this_week_count += 1
            elif last_monday <= d <= last_monday + timedelta(days=6):
                last_week_count += 1

    streak_bonus = max_current_streak * 10
    total_xp = (daily_completions * 10) + (weekly_completions * 30) + streak_bonus
    level = 1 + (total_xp // 100)
    xp_progress = total_xp % 100
    tree_stage = min(5, total_xp // 300)
    tree_stage_name = STAGE_NAMES.get(tree_stage, STAGE_NAMES[0])

    if total_expected_completions > 0:
        completion_rate = round(
            min(100.0, (total_completions / total_expected_completions) * 100.0), 1
        )
    else:
        completion_rate = 0.0

    if last_week_count == 0:
        growth_rate = 100.0 if this_week_count > 0 else 0.0
    else:
        growth_rate = round(
            ((this_week_count - last_week_count) / last_week_count) * 100.0, 1
        )

    average_streak = (
        round(sum(daily_streaks) / len(daily_streaks), 1) if daily_streaks else 0.0
    )

    weekly_report = WeeklyReportSummary(
        habit_counts=HabitCounts(
            total=len(habits),
            daily=daily_habit_count,
            weekly=weekly_habit_count,
        ),
        completed_this_week=this_week_count,
        average_streak=average_streak,
        longest_streak=max_longest_streak,
        completions_by_day=build_completions_by_day(all_completed_dates, current_monday),
        upcoming_due_dates=_build_upcoming_due_dates(habits, today, current_monday),
        this_week_completions=this_week_count,
        last_week_completions=last_week_count,
        growth_rate=growth_rate,
        message=_week_growth_message(this_week_count, last_week_count, growth_rate),
    )

    chart_data = build_chart_data(
        all_completed_dates=all_completed_dates,
        category_stats=category_stats,
        this_week_count=this_week_count,
        last_week_count=last_week_count,
        current_monday=current_monday,
        reference_date=today,
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
        chart_data=chart_data,
    )


async def get_user_stats(db: AsyncSession, user_id: int) -> StatsResponse:
    """Load habits for *user_id* and compute statistics."""
    habits = await get_habits_by_user(db, user_id)
    return compute_user_stats(habits)
