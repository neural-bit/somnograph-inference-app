const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON — keep statusText */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchModelInfo() {
  const res = await fetch(`${API_BASE}/api/model/info`);
  return handleResponse(res);
}

export async function uploadRecording(file, channel) {
  const form = new FormData();
  form.append("file", file);
  const url = new URL(`${API_BASE}/api/predict`);
  if (channel) url.searchParams.set("channel", channel);

  const res = await fetch(url, { method: "POST", body: form });
  return handleResponse(res);
}

export async function fetchEpochWaveform(sessionId, epochIndex) {
  const res = await fetch(`${API_BASE}/api/waveform/${sessionId}/${epochIndex}`);
  return handleResponse(res);
}
