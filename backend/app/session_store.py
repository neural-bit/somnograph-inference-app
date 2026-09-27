import time
import uuid
from dataclasses import dataclass, field

import numpy as np

from app.config import settings


@dataclass
class Session:
    epochs: np.ndarray       # (n_epochs, n_times) normalized float32
    sfreq: float
    channel: str
    created_at: float = field(default_factory=time.time)


_sessions: dict[str, Session] = {}


def create_session(epochs: np.ndarray, sfreq: float, channel: str) -> str:
    _sweep_expired()
    session_id = uuid.uuid4().hex
    _sessions[session_id] = Session(epochs=epochs, sfreq=sfreq, channel=channel)
    return session_id


def get_session(session_id: str) -> Session | None:
    return _sessions.get(session_id)


def _sweep_expired():
    cutoff = time.time() - settings.session_ttl_minutes * 60
    expired = [sid for sid, s in _sessions.items() if s.created_at < cutoff]
    for sid in expired:
        del _sessions[sid]
