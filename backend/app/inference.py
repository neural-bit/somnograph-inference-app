import numpy as np
import torch
import torch.nn.functional as F

from app.model_loader import STAGE_NAMES


@torch.no_grad()
def predict_epochs(model, device, epochs: np.ndarray, batch_size: int = 64):

    is_sequence_model = hasattr(model, "lstm")
    results = []

    for start in range(0, len(epochs), batch_size):
        batch = epochs[start:start + batch_size]
        x = torch.from_numpy(batch).unsqueeze(1).to(device)  # (b, 1, n_times)
        if is_sequence_model:
            x = x.unsqueeze(1)  # (b, seq_len=1, 1, n_times)
            logits = model(x).squeeze(1)  # (b, n_classes)
        else:
            logits = model(x)  # (b, n_classes)

        probs = F.softmax(logits, dim=-1).cpu().numpy()
        preds = probs.argmax(axis=-1)

        for p, pred in zip(probs, preds):
            results.append({
                "stage_index": int(pred),
                "stage_name": STAGE_NAMES[pred],
                "probabilities": {name: float(prob) for name, prob in zip(STAGE_NAMES, p)},
            })

    return results
