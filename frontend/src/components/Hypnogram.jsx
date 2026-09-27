import { useMemo, useRef } from "react";
import {
  STAGE_HYPNOGRAM_ROW,
  STAGE_COLOR,
  STAGE_ORDER,
  formatClock,
} from "../utils/stages.js";

const VIEW_W = 1000;
const VIEW_H = 170;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 120;
const RIBBON_TOP = 138;
const RIBBON_H = 16;
const ROW_COUNT = 5;
const ROW_H = (PLOT_BOTTOM - PLOT_TOP) / (ROW_COUNT - 1);

function stageY(stage) {
  return PLOT_TOP + STAGE_HYPNOGRAM_ROW[stage] * ROW_H;
}

function toRuns(epochs) {
  const runs = [];
  for (const ep of epochs) {
    const last = runs[runs.length - 1];
    if (last && last.stage === ep.stage_name) {
      last.end = ep.index + 1;
    } else {
      runs.push({ stage: ep.stage_name, start: ep.index, end: ep.index + 1 });
    }
  }
  return runs;
}

export default function Hypnogram({ epochs, selectedIndex, onSelect }) {
  const svgRef = useRef(null);
  const n = epochs.length;
  const xFor = (i) => (i / n) * VIEW_W;

  const stepPath = useMemo(() => {
    if (n === 0) return "";
    let d = `M 0 ${stageY(epochs[0].stage_name)}`;
    epochs.forEach((ep, i) => {
      const x0 = xFor(i);
      const x1 = xFor(i + 1);
      const y = stageY(ep.stage_name);
      d += ` L ${x0} ${y} L ${x1} ${y}`;
      const next = epochs[i + 1];
      if (next) d += ` L ${x1} ${stageY(next.stage_name)}`;
    });
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epochs, n]);

  const runs = useMemo(() => toRuns(epochs), [epochs]);

  function handleClick(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const index = Math.min(n - 1, Math.max(0, Math.floor(ratio * n)));
    onSelect(index);
  }

  if (n === 0) return null;
  const cursorXMid = (xFor(selectedIndex) + xFor(selectedIndex + 1)) / 2;

  return (
    <svg
      ref={svgRef}
      className="hypnogram-svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      onClick={handleClick}
    >
      {STAGE_ORDER.map((s) => (
        <text
          key={s}
          x={24}
          y={stageY(s) + 3}
          textAnchor="end"
          className="hypnogram-row-label"
        >
          {s}
        </text>
      ))}

      <path
        d={stepPath}
        transform="translate(28,0) scale(0.972,1)"
        fill="none"
        stroke="var(--color-text)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {runs.map((run, i) => (
        <rect
          key={i}
          x={28 + xFor(run.start) * 0.972}
          y={RIBBON_TOP}
          width={Math.max(1, (xFor(run.end) - xFor(run.start)) * 0.972)}
          height={RIBBON_H}
          fill={STAGE_COLOR[run.stage]}
          opacity="0.9"
        />
      ))}

      <line
        className="hypnogram-cursor"
        x1={28 + cursorXMid * 0.972}
        x2={28 + cursorXMid * 0.972}
        y1={PLOT_TOP - 4}
        y2={RIBBON_TOP + RIBBON_H}
      />

      <text x={28} y={VIEW_H - 2} className="hypnogram-axis-label">
        0:00
      </text>
      <text
        x={VIEW_W}
        y={VIEW_H - 2}
        textAnchor="end"
        className="hypnogram-axis-label"
      >
        {formatClock(epochs[n - 1].start_time_sec)}
      </text>
    </svg>
  );
}
