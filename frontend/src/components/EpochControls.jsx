import { useEffect, useRef, useState } from "react";
import { formatClock } from "../utils/stages.js";

export default function EpochControls({ index, total, epochLengthSec, onChange }) {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        onChange((i) => {
          const next = i + 1;
          if (next >= total) {
            setPlaying(false);
            return i;
          }
          return next;
        });
      }, 700);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, total]);

  return (
    <div className="epoch-controls">
      <button
        className="icon-btn"
        onClick={() => onChange((i) => Math.max(0, i - 1))}
        disabled={index === 0}
        aria-label="Previous epoch"
      >
        ‹
      </button>

      <button
        className={`icon-btn${playing ? " playing" : ""}`}
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Play through night"}
      >
        {playing ? "❚❚" : "▸"}
      </button>

      <button
        className="icon-btn"
        onClick={() => onChange((i) => Math.min(total - 1, i + 1))}
        disabled={index === total - 1}
        aria-label="Next epoch"
      >
        ›
      </button>

      <span className="epoch-position">
        Epoch {index + 1} / {total} · {formatClock(index * epochLengthSec)}
      </span>
    </div>
  );
}
