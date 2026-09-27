import { STAGE_ORDER, STAGE_COLOR, STAGE_FULL_LABEL } from "../utils/stages.js";

export default function StageLegend() {
  return (
    <div className="sidebar-section">
      <h2>Stages</h2>
      <div className="legend-list">
        {STAGE_ORDER.map((stage) => (
          <div className="legend-item" key={stage}>
            <span
              className="legend-swatch"
              style={{ background: STAGE_COLOR[stage] }}
            />
            {STAGE_FULL_LABEL[stage]}
          </div>
        ))}
      </div>
    </div>
  );
}
