import React, { useState } from "react";
import { FileUploader, MetricSummary } from "@packages/trem-ui";
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

const humanize = (value = "") =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

const displayValue = (value, format) => {
  if (value == null || value === "") return "Not recorded";
  if (format === "date") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Not recorded"
      : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
  }
  if (format === "score") return `${Math.round(Number(value) || 0)}/100`;
  if (format === "rating") return `${Number(value || 0).toFixed(1)}/5`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/** Backend-configured projection for system-derived ratings and analytics. */
export const ReadOnlyObjectWidget = ({ widget, value }) => {
  const source = value || {};
  const configuredFields = Array.isArray(widget.fields) ? widget.fields : [];
  const fields = configuredFields.length
    ? configuredFields
    : Object.keys(source).map((key) => ({ key, label: humanize(key) }));
  const primary = fields.filter((field) => field.kind !== "detail");
  const details = fields.filter((field) => field.kind === "detail" && source[field.key]);

  if (widget.presentation === "metrics") {
    return (
      <FieldShell widget={widget} error={null} className="tb-field--analytics">
        <MetricSummary
          variant="cards"
          ariaLabel={`${widget.label || "Tour"} analytics`}
          className="tb-readonly-metrics"
          items={primary.map((field) => ({
            id: field.key,
            label: field.label || humanize(field.key),
            value: displayValue(source[field.key] ?? field.emptyValue ?? 0, field.format),
            icon: field.icon || "sparkles",
            helper: field.helper,
          }))}
        />
        {details.length ? (
          <dl className="tb-readonly-activity">
            {details.map((field) => (
              <div key={field.key}>
                <dt>{field.label || humanize(field.key)}</dt>
                <dd>{displayValue(source[field.key], field.format || "date")}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="tb-readonly__empty">Activity timestamps appear after travellers interact with this tour.</p>
        )}
      </FieldShell>
    );
  }

  return (
    <FieldShell widget={widget} error={null}>
      <dl className="tb-readonly">
        {fields.filter((field) => source[field.key] != null).map((field) => (
          <div className="tb-readonly__row" key={field.key}>
            <dt>{field.label || humanize(field.key)}</dt>
            <dd>{displayValue(source[field.key], field.format)}</dd>
          </div>
        ))}
        {!Object.keys(source).length && <dd className="tb-readonly__empty">No values recorded yet.</dd>}
      </dl>
    </FieldShell>
  );
};

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
