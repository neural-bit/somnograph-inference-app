import os
import torch

from app.config import settings
from app.model_arch import build_model

STAGE_NAMES = ["W", "N1", "N2", "N3", "REM"]
STAGE_FULL_NAMES = {
    "W": "Wake",
    "N1": "N1 (light sleep)",
    "N2": "N2 (light sleep)",
    "N3": "N3 (deep sleep)",
    "REM": "REM (dream sleep)",
}


def resolve_device(pref: str) -> str:
    if pref == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    return pref


def load_model():
    device = resolve_device(settings.device)

    if os.path.exists(settings.checkpoint_path):
        # TorchScript models contain both the architecture and weights
        model = torch.jit.load(settings.checkpoint_path, map_location=device)
        print(f"[model_loader] Loaded TorchScript model from {settings.checkpoint_path}")
    else:
        # Fallback to an untrained instance built from architecture definition
        model_kwargs = dict(
            n_classes=len(STAGE_NAMES),
            base_filters=settings.base_filters,
            dropout=settings.dropout,
        )
        model = build_model(settings.model_name, **model_kwargs)
        print(f"[model_loader] WARNING: no checkpoint found at '{settings.checkpoint_path}'. "
              f"Serving an UNTRAINED model.")

    model.to(device)
    model.eval()
    return model, device
