import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Hypnogram from "./components/Hypnogram.jsx";
import EEGViewer from "./components/EEGViewer.jsx";
import EpochControls from "./components/EpochControls.jsx";
import { fetchModelInfo, uploadRecording } from "./api.js";
import "./styles/App.css";

export default function App() {
  const [modelInfo, setModelInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch(() => setModelInfo(null));
  }, []);

  async function handleSubmit(file, channel) {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadRecording(file, channel);
      setResult(data);
      setSelectedIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedEpoch = result?.epochs[selectedIndex];

  return (
    <div className="app-shell">
      <Sidebar
        onSubmit={handleSubmit}
        loading={loading}
        result={result}
        modelInfo={modelInfo}
      />

      <main className="main">
        <div className="main-header">
          <h1>{result ? "Sleep stage results" : "No recording loaded"}</h1>
          {result && <span className="filename">{result.filename}</span>}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {!result && !error && (
          <div className="empty-state">
            <div className="empty-state-inner">
              <h2>Upload a PSG recording to begin</h2>
              <p>
                Pick a Sleep-EDF-style .edf file in the sidebar. It's processed into
                30-second epochs and classified into five sleep stages (Wake, N1, N2, N3,
                REM) — the hypnogram and per-epoch EEG will appear here.
              </p>
            </div>
          </div>
        )}

        {result && selectedEpoch && (
          <>
            <div className="panel">
              <div className="panel-title-row">
                <h2>Full-night hypnogram</h2>
              </div>
              <Hypnogram
                epochs={result.epochs}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
            </div>

            <EEGViewer
              sessionId={result.session_id}
              epoch={selectedEpoch}
              epochLengthSec={result.epoch_length_sec}
            />

            <EpochControls
              index={selectedIndex}
              total={result.n_epochs}
              epochLengthSec={result.epoch_length_sec}
              onChange={setSelectedIndex}
            />
          </>
        )}
      </main>
    </div>
  );
}
