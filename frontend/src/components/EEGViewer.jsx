import { useEffect, useRef, useState } from "react";
import { fetchEpochWaveform } from "../api.js";
import { STAGE_ORDER, STAGE_COLOR, STAGE_FULL_LABEL } from "../utils/stages.js";

export default function EEGViewer({ sessionId, epoch, epochLengthSec }) {
  const canvasRef = useRef(null);
  const [samples, setSamples] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEpochWaveform(sessionId, epoch.index)
      .then((data) => {
        if (!cancelled) setSamples(data.samples);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, epoch.index]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !samples) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Gridlines every 5 seconds
    ctx.strokeStyle = "rgba(140, 152, 172, 0.15)";
    ctx.lineWidth = 1;
    const secondsPerEpoch = epochLengthSec;
    for (let s = 0; s <= secondsPerEpoch; s += 5) {
      const x = (s / secondsPerEpoch) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = "rgba(140, 152, 172, 0.25)";
    ctx.stroke();

    // Waveform, scaled to fill ~80% of the vertical space
    const maxAbs = Math.max(1e-6, ...samples.map((v) => Math.abs(v)));
    const scale = (h / 2) * 0.8 / maxAbs;

    ctx.beginPath();
    ctx.strokeStyle = STAGE_COLOR[epoch.stage_name] || "#7fb8d9";
    ctx.lineWidth = 1.3;
    samples.forEach((v, i) => {
      const x = (i / (samples.length - 1)) * w;
      const y = h / 2 - v * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  const topStage = Object.entries(epoch.probabilities).sort((a, b) => b[1] - a[1])[0];
  const confidencePct = Math.round(topStage[1] * 100);

  return (
    <div className="panel">
      <div className="panel-title-row">
        <h2>
          EEG — epoch {epoch.index + 1}, starting {Math.floor(epoch.start_time_sec / 60)}m{" "}
          {Math.floor(epoch.start_time_sec % 60)}s
        </h2>
      </div>

      <div className="stage-readout">
        <span
          className="stage-badge"
          style={{
            background: `${STAGE_COLOR[epoch.stage_name]}22`,
            color: STAGE_COLOR[epoch.stage_name],
          }}
        >
          <span
            className="stage-badge-dot"
            style={{ background: STAGE_COLOR[epoch.stage_name] }}
          />
          {STAGE_FULL_LABEL[epoch.stage_name]}
        </span>
        <span className="confidence-text">{confidencePct}% confidence</span>
      </div>

      <div className="eeg-canvas-wrap" style={{ marginTop: "var(--space-4)" }}>
        <canvas ref={canvasRef} className="eeg-canvas" />
        {loading && <div className="eeg-loading">Loading waveform…</div>}
        {error && <div className="eeg-loading">{error}</div>}
      </div>

      <div className="prob-bars">
        {STAGE_ORDER.map((stage) => {
          const p = epoch.probabilities[stage] ?? 0;
          return (
            <div className="prob-bar-row" key={stage}>
              <span>{stage}</span>
              <span className="prob-bar-track">
                <span
                  className="prob-bar-fill"
                  style={{ width: `${p * 100}%`, background: STAGE_COLOR[stage] }}
                />
              </span>
              <span>{Math.round(p * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
