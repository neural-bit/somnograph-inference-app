from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    # Model checkpoint (a state_dict saved as {"model_state": ..., ...}.
    model_name: str = "cnn"                 # "cnn" or "cnn_lstm" (see model_arch.py)
    checkpoint_path: str = "models/best_model.pt"
    base_filters: int = 32
    dropout: float = 0.3
    device: str = "auto"                     # "auto", "cpu", or "cuda"

    # Signal processing — must match what the checkpoint was trained on.
    target_sfreq: float = 100.0
    epoch_length_sec: int = 30
    default_channel: str = "EEG Fpz-Cz"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # In-memory session store TTL (minutes). See app/session_store.py.
    session_ttl_minutes: int = 60

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
