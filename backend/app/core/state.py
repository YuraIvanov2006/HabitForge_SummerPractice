import datetime
from threading import Lock

_class_lock = Lock()
_current_date: datetime.date | None = None


def get_current_date() -> datetime.date:
    """Return the overridden date if set, otherwise today."""
    with _class_lock:
        return _current_date or datetime.date.today()


def set_current_date(new_date: datetime.date | None) -> None:
    """Set a global override date. Pass None to clear the override."""
    with _class_lock:
        global _current_date
        _current_date = new_date
