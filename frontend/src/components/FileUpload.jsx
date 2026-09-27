import { useRef, useState } from "react";

const CHANNEL_OPTIONS = ["EEG Fpz-Cz", "EEG Pz-Oz"];

export default function FileUpload({ onSubmit, loading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [channel, setChannel] = useState(CHANNEL_OPTIONS[0]);
  const [dragging, setDragging] = useState(false);

  function pickFile(list) {
    const f = list?.[0];
    if (f) setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (file) onSubmit(file, channel);
  }

  return (
    <form className="sidebar-section" onSubmit={handleSubmit}>
      <h2>Upload recording</h2>

      <div
        className={`dropzone${dragging ? " dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="dropzone-label">
          {file ? "Change file" : "Drop a PSG .edf file, or click to browse"}
        </div>
        {file && <div className="dropzone-filename">{file.name}</div>}
        <input
          ref={inputRef}
          type="file"
          accept=".edf"
          onChange={(e) => pickFile(e.target.files)}
        />
      </div>

      <div className="field-row">
        <label htmlFor="channel-select">EEG channel</label>
        <select
          id="channel-select"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          {CHANNEL_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <button className="btn-primary" type="submit" disabled={!file || loading}>
        {loading ? "Analyzing…" : "Classify sleep stages"}
      </button>
    </form>
  );
}
