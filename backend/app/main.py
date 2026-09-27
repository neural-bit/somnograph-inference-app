"""
FastAPI inference service for sleep stage classification.

Endpoints:
    GET  /api/health                                  liveness check
    GET  /api/model/info                               model + config metadata
    POST /api/predict                                   upload a .edf, get per-epoch predictions
    GET  /api/waveform/{session_id}/{epoch_index}       full-resolution waveform for one epoch

Run with:
    uvicorn app.main:app --reload --port 8000
"""

import os
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.inference import predict_epochs
from app.model_loader import STAGE_FULL_NAMES, STAGE_NAMES, load_model
from app.preprocessing import ChannelNotFoundError, load_edf_for_inference
from app.schemas import (HealthResponse, ModelInfoResponse, PredictResponse,
                          WaveformResponse)
from app.session_store import create_session, get_session

ml_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    model, device = load_model()
    ml_state["model"] = model
    ml_state["device"] = device
    ml_state["checkpoint_loaded"] = os.path.exists(settings.checkpoint_path)
    yield
    ml_state.clear()


app = FastAPI(
    title="Sleep Stage Classification — Inference Service",
    description="Upload a PSG EDF recording and get per-epoch (30s) sleep stage predictions.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health():
    return {"status": "ok"}


@app.get("/api/model/info", response_model=ModelInfoResponse)
def model_info():
    return {
        "model_name": settings.model_name,
        "stage_names": STAGE_NAMES,
        "stage_full_names": STAGE_FULL_NAMES,
        "epoch_length_sec": settings.epoch_length_sec,
        "target_sfreq": settings.target_sfreq,
        "device": ml_state.get("device", "unknown"),
        "checkpoint_loaded": ml_state.get("checkpoint_loaded", False),
    }


@app.post("/api/predict", response_model=PredictResponse)
async def predict(
    file: UploadFile = File(..., description="A PSG recording in EDF format"),
    channel: str = Query(settings.default_channel, description="EEG channel to analyze"),
):
    if not file.filename.lower().endswith(".edf"):
        raise HTTPException(400, "Please upload a .edf file (European Data Format).")

    with tempfile.NamedTemporaryFile(suffix=".edf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        epochs, sfreq, duration_sec, resolved_channel = load_edf_for_inference(
            tmp_path, channel=channel,
            target_sfreq=settings.target_sfreq, epoch_sec=settings.epoch_length_sec,
        )
    except ChannelNotFoundError as exc:
        raise HTTPException(422, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - surface a clean 400 instead of a 500 traceback
        raise HTTPException(400, f"Could not read this file as EDF: {exc}") from exc
    finally:
        os.unlink(tmp_path)

    predictions = predict_epochs(ml_state["model"], ml_state["device"], epochs)
    session_id = create_session(epochs, sfreq, resolved_channel)

    stage_counts = {name: 0 for name in STAGE_NAMES}
    epoch_records = []
    for i, pred in enumerate(predictions):
        stage_counts[pred["stage_name"]] += 1
        epoch_records.append({
            "index": i,
            "start_time_sec": i * settings.epoch_length_sec,
            "stage_index": pred["stage_index"],
            "stage_name": pred["stage_name"],
            "probabilities": pred["probabilities"],
        })

    return {
        "session_id": session_id,
        "filename": file.filename,
        "channel": resolved_channel,
        "sfreq": sfreq,
        "epoch_length_sec": settings.epoch_length_sec,
        "n_epochs": len(epochs),
        "duration_sec": duration_sec,
        "stage_names": STAGE_NAMES,
        "stage_counts": stage_counts,
        "epochs": epoch_records,
    }


@app.get("/api/waveform/{session_id}/{epoch_index}", response_model=WaveformResponse)
def waveform(session_id: str, epoch_index: int):
    session = get_session(session_id)
    if session is None:
        raise HTTPException(404, "Session not found or expired. Please re-upload the file.")
    if not (0 <= epoch_index < len(session.epochs)):
        raise HTTPException(404, f"Epoch {epoch_index} out of range (0..{len(session.epochs) - 1}).")

    samples = session.epochs[epoch_index]
    return {
        "session_id": session_id,
        "epoch_index": epoch_index,
        "sfreq": session.sfreq,
        "start_time_sec": epoch_index * settings.epoch_length_sec,
        "samples": samples.tolist(),
    }
