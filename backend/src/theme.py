"""Server-authoritative configuration for the application's time-based theme."""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

THEME_TIMEZONE_ENV = "THEME_TIMEZONE"
DEFAULT_THEME_TIMEZONE = "Europe/Helsinki"
THEME_REVISION = 1

_THEME_PERIODS = (
    (0, "night"),
    (6, "morning"),
    (12, "afternoon"),
    (18, "evening"),
)

_THEME_PALETTES = {
    "night": {"start": "#3d3676", "end": "#5b2c74"},
    "morning": {"start": "#9c426a", "end": "#714b9f"},
    "afternoon": {"start": "#6351ad", "end": "#a24d65"},
    "evening": {"start": "#471e6e", "end": "#4f465b"},
}


def _get_timezone(timezone_name: str | None = None) -> ZoneInfo:
    """Return the configured IANA timezone, failing fast for invalid deployment config."""
    return ZoneInfo(timezone_name or os.getenv(THEME_TIMEZONE_ENV, DEFAULT_THEME_TIMEZONE))


def _get_period(hour: int) -> str:
    """Return the named theme period for a local hour."""
    for start_hour, period in reversed(_THEME_PERIODS):
        if hour >= start_hour:
            return period
    return "night"


def _next_change_at(now: datetime) -> datetime:
    """Return the next server-defined period boundary after ``now``."""
    for start_hour, _ in _THEME_PERIODS:
        candidate = now.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        if candidate > now:
            return candidate
    return (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)


def get_active_theme(
    now: datetime | None = None,
    *,
    timezone_name: str | None = None,
) -> dict[str, object]:
    """Build the frontend contract for the active server-controlled theme.

    ``now`` and ``timezone_name`` make the pure calculation testable. Production callers
    omit both so this always follows the configured server timezone.
    """
    timezone = _get_timezone(timezone_name)
    if now is None:
        local_now = datetime.now(timezone)
    elif now.tzinfo is None:
        local_now = now.replace(tzinfo=timezone)
    else:
        local_now = now.astimezone(timezone)

    period = _get_period(local_now.hour)
    palette = _THEME_PALETTES[period]
    next_change = _next_change_at(local_now)

    return {
        "period": period,
        "background": palette,
        "next_change_at": next_change.isoformat(),
        "server_time": local_now.isoformat(),
        "timezone": timezone.key,
        "revision": THEME_REVISION,
    }
