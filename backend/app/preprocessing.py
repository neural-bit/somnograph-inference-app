import numpy as np
import mne


class ChannelNotFoundError(ValueError):
    def __init__(self, requested: str, available: list[str]):
        self.requested = requested
        self.available = available
        super().__init__(
            f"Channel '{requested}' not found in the uploaded file. "
            f"Available channels: {available}"
        )


def load_edf_for_inference(file_path: str, channel: str, target_sfreq: float, epoch_sec: int):
    """
    Returns:
        epochs: (n_epochs, n_times) float32 array, one row per 30s window
        sfreq:  the (possibly resampled) sampling frequency actually used
        duration_sec: total usable recording duration (n_epochs * epoch_sec)
    """
    raw = mne.io.read_raw_edf(file_path, preload=True, verbose=False)

    if channel not in raw.ch_names:
        # Try a case-insensitive / substring match before giving up, since
        # channel naming varies a lot between EDF exports.
        match = next((c for c in raw.ch_names if channel.lower() in c.lower()), None)
        if match is None:
            raise ChannelNotFoundError(channel, raw.ch_names)
        channel = match

    raw.pick([channel])
    if abs(raw.info["sfreq"] - target_sfreq) > 1e-6:
        raw.resample(target_sfreq)

    data = raw.get_data()[0].astype(np.float32)  # (n_samples,)
    n_per_epoch = int(target_sfreq * epoch_sec)
    n_epochs = len(data) // n_per_epoch
    if n_epochs == 0:
        raise ValueError(
            f"Recording is shorter than one {epoch_sec}s epoch at {target_sfreq}Hz."
        )

    trimmed = data[: n_epochs * n_per_epoch]
    epochs = trimmed.reshape(n_epochs, n_per_epoch)

    # Per-recording z-score normalization
    mu, sigma = epochs.mean(), epochs.std() + 1e-8
    epochs = (epochs - mu) / sigma

    return epochs, target_sfreq, n_epochs * epoch_sec, channel
