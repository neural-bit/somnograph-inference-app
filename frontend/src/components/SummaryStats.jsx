import { STAGE_ORDER, STAGE_COLOR, formatClock } from "../utils/stages.js";

export default function SummaryStats({ result }) {
  const { stage_counts, n_epochs, epoch_length_sec, duration_sec } = result;
  const sleepEpochs = n_epochs - (stage_counts.W || 0);
  const efficiency = n_epochs > 0 ? Math.round((sleepEpochs / n_epochs) * 100) : 0;

  return (
    <div className="sidebar-section">
      <h2>Night summary</h2>
      {STAGE_ORDER.map((stage) => {
        const count = stage_counts[stage] || 0;
        const pct = n_epochs > 0 ? (count / n_epochs) * 100 : 0;
        return (
          <div className="stat-row" key={stage}>
            <span className="stat-label">{stage}</span>
            <span className="stat-bar-track">
              <span
                className="stat-bar-fill"
                style={{ width: `${pct}%`, background: STAGE_COLOR[stage] }}
              />
            </span>
            <span className="stat-value">{Math.round(pct)}%</span>
          </div>
        );
      })}
      <div className="stat-summary-line">
        <span>Recording length</span>
        <span>{formatClock(duration_sec)}</span>
      </div>
      <div className="stat-summary-line">
        <span>Sleep efficiency</span>
        <span>{efficiency}%</span>
      </div>
      <div className="stat-summary-line">
        <span>Epochs analyzed</span>
        <span>
          {n_epochs} × {epoch_length_sec}s
        </span>
      </div>
    </div>
  );
}
