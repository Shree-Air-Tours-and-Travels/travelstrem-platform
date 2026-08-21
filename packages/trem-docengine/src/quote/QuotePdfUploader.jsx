import React from "react";
import "./quoteDocument.css";

export default function QuotePdfUploader({ onUpload, disabled = false, uploadedFileName = "", busy = false, maxSizeMb = 15 }) {
  const [file, setFile] = React.useState(null);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef(null);

  const choose = (event) => {
    const selected = event.target.files?.[0] || null;
    setError("");
    if (selected && selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Choose a PDF file.");
      return;
    }
    if (selected && selected.size > maxSizeMb * 1024 * 1024) {
      setFile(null);
      setError(`PDF must be ${maxSizeMb} MB or smaller.`);
      return;
    }
    setFile(selected);
  };

  const upload = async () => {
    if (!file || !onUpload) return;
    const uploaded = await onUpload(file);
    if (uploaded === false) return;
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="trem-docengine-upload">
      <label className="trem-docengine-upload__picker">
        <span>{file ? file.name : "Choose final quote PDF"}</span>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" disabled={disabled || busy} onChange={choose} />
      </label>
      <button type="button" disabled={disabled || busy || !file} onClick={upload}>{busy ? "Uploading…" : "Upload PDF"}</button>
      {error ? <p className="is-error">{error}</p> : null}
      {uploadedFileName ? <p className="is-ready">Ready to send: <strong>{uploadedFileName}</strong></p> : <p>The quote cannot be sent until its final PDF is uploaded.</p>}
    </div>
  );
}
