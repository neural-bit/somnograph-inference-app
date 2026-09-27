import FileUpload from "./FileUpload.jsx";
import StageLegend from "./StageLegend.jsx";
import SummaryStats from "./SummaryStats.jsx";

export default function Sidebar({ onSubmit, loading, result, modelInfo }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">Somnograph</div>
        <div className="brand-tagline">EEG sleep stage viewer</div>
      </div>

      <FileUpload onSubmit={onSubmit} loading={loading} />

      <StageLegend />

      {result && <SummaryStats result={result} />}

      <div className="model-footer">
        {modelInfo ? (
          <>
            <span>
              Model: {modelInfo.model_name} · {modelInfo.device}
            </span>
            {!modelInfo.checkpoint_loaded && (
              <span className="warn">No trained checkpoint loaded — predictions are random.</span>
            )}
          </>
        ) : (
          <span>Connecting to inference service…</span>
        )}
      </div>
    </aside>
  );
}
