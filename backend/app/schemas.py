from pydantic import BaseModel


class EpochPrediction(BaseModel):
    index: int
    start_time_sec: float
    stage_index: int
    stage_name: str
    probabilities: dict[str, float]


class PredictResponse(BaseModel):
    session_id: str
    filename: str
    channel: str
    sfreq: float
    epoch_length_sec: int
    n_epochs: int
    duration_sec: float
    stage_names: list[str]
    stage_counts: dict[str, int]
    epochs: list[EpochPrediction]


class WaveformResponse(BaseModel):
    session_id: str
    epoch_index: int
    sfreq: float
    start_time_sec: float
    samples: list[float]


class ModelInfoResponse(BaseModel):
    model_name: str
    stage_names: list[str]
    stage_full_names: dict[str, str]
    epoch_length_sec: int
    target_sfreq: float
    device: str
    checkpoint_loaded: bool


class HealthResponse(BaseModel):
    status: str
