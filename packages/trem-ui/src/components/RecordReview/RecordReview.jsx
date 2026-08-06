import React from "react";
import "./RecordReview.styles.scss";

const HIDDEN_KEYS = new Set(["_id", "_key", "__v"]);

function labelFor(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isEmpty(value) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

function isImageUrl(value) {
  if (typeof value !== "string") return false;
  return /^(data:image\/|https?:\/\/)/i.test(value) && /(?:\.(?:avif|gif|jpe?g|png|webp|svg)(?:\?.*)?$|^data:image\/)/i.test(value);
}

function PrimitiveValue({ value }) {
  if (typeof value === "boolean") {
    return <span className={`record-review__boolean record-review__boolean--${value ? "yes" : "no"}`}>{value ? "Yes" : "No"}</span>;
  }
  if (isImageUrl(value)) return <img className="record-review__image" src={value} alt="Record media" />;
  return <span className="record-review__value">{value == null || value === "" ? "Not provided" : String(value)}</span>;
}

function ObjectFields({ value }) {
  const entries = Object.entries(value || {}).filter(([key]) => !HIDDEN_KEYS.has(key));
  return <div className="record-review__fields">
    {entries.map(([key, child]) => (
      <Field key={key} name={key} value={child} />
    ))}
  </div>;
}

function Field({ name, value }) {
  if (Array.isArray(value)) {
    return <div className="record-review__field record-review__field--wide">
      <span className="record-review__label">{labelFor(name)}</span>
      {value.length === 0 ? <span className="record-review__empty">None</span> : (
        typeof value[0] === "object" && value[0] !== null
          ? <div className="record-review__collection">{value.map((item, index) => <article className="record-review__item" key={item?._id || item?._key || index}><strong>{item?.title || item?.seasonName || item?.propertyName || item?.label || `Item ${index + 1}`}</strong><ObjectFields value={item} /></article>)}</div>
          : <div className="record-review__chips">{value.map((item, index) => <span key={`${item}-${index}`}>{String(item)}</span>)}</div>
      )}
    </div>;
  }

  if (value && typeof value === "object") {
    return <div className="record-review__field record-review__field--wide">
      <span className="record-review__label">{labelFor(name)}</span>
      <ObjectFields value={value} />
    </div>;
  }

  return <div className={`record-review__field${isEmpty(value) ? " record-review__field--empty" : ""}`}>
    <span className="record-review__label">{labelFor(name)}</span>
    <PrimitiveValue value={value} />
  </div>;
}

export default function RecordReview({ data, title = "Complete record preview", description = "Review every value below before submitting." }) {
  const source = data && typeof data === "object" ? data : {};
  const entries = Object.entries(source).filter(([key]) => !HIDDEN_KEYS.has(key));

  return <section className="record-review" aria-label={title}>
    <header className="record-review__header">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <span className="record-review__count">{entries.length} field groups</span>
    </header>
    <ObjectFields value={source} />
  </section>;
}
