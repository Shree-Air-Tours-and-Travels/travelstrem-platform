import React, { useState } from "react";
import { FileUploader } from "@packages/trem-ui";
import FieldShell from "./FieldShell.jsx";

const parseJson = (text) => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};

/**
 * Arbitrary-JSON editor for Schema.Types.Mixed fields (commercial.details).
 * Preserves any structure the backend stores; validates syntax client-side only.
 */
export const JsonWidget = ({ widget, value, onChange, error }) => {
  const [text, setText] = useState(() => (value == null ? "" : JSON.stringify(value, null, 2)));
  const [invalid, setInvalid] = useState(false);

  return (
    <FieldShell widget={widget} error={error}>
      <textarea
        className={`tb-json${invalid ? " tb-json--invalid" : ""}`}
        rows={Math.max(4, Math.min(20, Math.ceil((widget.height || 140) / 22)))}
        spellCheck={false}
        readOnly={!!widget.readOnly || !!widget.disabled}
        value={text}
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);
          if (!nextText.trim()) {
            setInvalid(false);
            onChange(widget.path, null);
            return;
          }
          const parsed = parseJson(nextText);
          setInvalid(!parsed.ok);
          if (parsed.ok) onChange(widget.path, parsed.value);
        }}
      />
      {invalid && <small className="tb-field__error">Enter valid JSON before continuing.</small>}
    </FieldShell>
  );
};

/** Read-only projection of system-derived objects (rating, metrics, derived). */
export const ReadOnlyObjectWidget = ({ widget, value }) => (
  <FieldShell widget={widget} error={null}>
    <dl className="tb-readonly">
      {Object.entries(value || {})
        .filter(([, item]) => item != null)
        .map(([key, item]) => (
          <div className="tb-readonly__row" key={key}>
            <dt>{key}</dt>
            <dd>{typeof item === "object" ? JSON.stringify(item) : String(item)}</dd>
          </div>
        ))}
      {!Object.keys(value || {}).length && (
        <dd className="tb-readonly__empty">No values recorded yet.</dd>
      )}
    </dl>
  </FieldShell>
);

/**
 * Image gallery upload. Transport is injected by the host portal through
 * WidgetContext so this package never owns upload endpoints.
 */
export const ImageUploadWidget = ({ widget, value = [], onChange, error, uploader }) => (
  <FieldShell widget={widget} error={error}>
    <FileUploader
      variant="gallery"
      label="Add tour photos"
      description="JPG, PNG, AVIF or WebP · up to 10 MB each"
      accept="image/jpeg,image/png,image/avif,image/webp"
      maxFileSize={10 * 1024 * 1024}
      maxFiles={widget.maxFiles || 20}
      multiple
      value={Array.isArray(value) ? value : []}
      disabled={widget.disabled || uploader?.uploading}
      readOnly={widget.readOnly}
      error={error}
      transport={async ({ files, onProgress }) => {
        if (typeof uploader?.upload !== "function")
          throw new Error("Image upload is not available in this portal.");
        return uploader.upload(files, { onProgress });
      }}
      onChange={(urls) => onChange(widget.path, Array.isArray(urls) ? urls : [])}
      renderPreview={(url) => <img src={url} alt="" />}
      renderFileActions={
        widget.coverPath !== null && !widget.readOnly
          ? (url) => (
              <button
                type="button"
                className="tb-gallery__cover"
                onClick={() => onChange(widget.coverPath || "photo", url)}
              >
                Set cover
              </button>
            )
          : undefined
      }
    />
  </FieldShell>
);

export default JsonWidget;
