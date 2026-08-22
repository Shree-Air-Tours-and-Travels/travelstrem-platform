import React from "react";
import { Button, FileUploader } from "@packages/trem-ui";
import "./quoteDocument.css";

export default function QuotePdfUploader({ onUpload, disabled = false, uploadedFileName = "", busy = false, maxSizeMb = 15 }) {
  const [file, setFile] = React.useState(null);
  const [error, setError] = React.useState("");

  const upload = async () => {
    if (!file || !onUpload) return;
    const uploaded = await onUpload(file);
    if (uploaded !== false) setFile(null);
  };

  return <div className="trem-docengine-upload">
    <FileUploader
      variant="compact"
      label="Choose final quote PDF"
      accept="application/pdf,.pdf"
      maxFileSize={maxSizeMb * 1024 * 1024}
      value={file}
      onChange={(selected) => { setError(""); setFile(selected); }}
      onError={(issues) => setError(issues[0]?.message || "Choose a valid PDF file.")}
      disabled={disabled || busy}
      selectionOnly
      autoUpload={false}
    />
    <Button type="button" variant="solid" color="primary" disabled={disabled || busy || !file} onClick={upload} text={busy ? "Uploading…" : "Upload PDF"} />
    {error ? <p className="is-error">{error}</p> : null}
    {uploadedFileName ? <p className="is-ready">Ready to send: <strong>{uploadedFileName}</strong></p> : <p>The quote cannot be sent until its final PDF is uploaded.</p>}
  </div>;
}
