export const STAGE_ORDER = ["W", "N1", "N2", "N3", "REM"];

export const STAGE_COLOR = {
  W: "#F2B84B",
  N1: "#8FCACA",
  N2: "#5B9BD5",
  N3: "#2E4C8A",
  REM: "#C77DFF",
};

export const STAGE_FULL_LABEL = {
  W: "Wake",
  N1: "N1 — light sleep",
  N2: "N2 — light sleep",
  N3: "N3 — deep sleep",
  REM: "REM — dream sleep",
};

export const STAGE_HYPNOGRAM_ROW = { W: 0, REM: 1, N1: 2, N2: 3, N3: 4 };

export function formatClock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
