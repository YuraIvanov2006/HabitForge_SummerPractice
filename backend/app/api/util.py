"""
app/api/util.py
───────────────
Utility endpoints for testing and operational tooling.
"""
from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.state import get_current_date, is_date_overridden, set_current_date
from app.schemas.util import CurrentDateResponse, DateOverrideRequest

router = APIRouter(prefix="/api/util", tags=["Utilities"])


def _ensure_date_override_allowed() -> None:
    if settings.is_production and not settings.ALLOW_DATE_OVERRIDE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Date override is disabled in this environment.",
        )


@router.get(
    "/date",
    response_model=CurrentDateResponse,
    summary="Get the effective server date",
)
async def read_current_date() -> CurrentDateResponse:
    """Return the virtual or real current date used by date-dependent logic."""
    effective = get_current_date()
    return CurrentDateResponse(
        date=effective.isoformat(),
        is_overridden=is_date_overridden(),
    )


@router.post(
    "/date",
    response_model=CurrentDateResponse,
    summary="Set or clear the virtual server date",
)
async def override_current_date(payload: DateOverrideRequest) -> CurrentDateResponse:
    """
    Set a global virtual date for testing and reporting simulations.

    Pass ``{"date": null}`` to clear the override and revert to the real clock.
    Disabled when ``ALLOW_DATE_OVERRIDE`` is false in production.
    """
    _ensure_date_override_allowed()
    set_current_date(payload.date)
    effective = get_current_date()
    return CurrentDateResponse(
        date=effective.isoformat(),
        is_overridden=is_date_overridden(),
    )
