import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Dropdown,
  EmptyState,
  InputField,
  PRODUCT_TYPE,
  RecordReview,
  Spinner,
  SubTitle,
  TrevioTripCard,
} from "@packages/trem-ui";
import { getTripJsonTemplate } from "@packages/trem-utils";
import {
  deletePartnerTrevioTrip,
  approvePartnerTrevioTrip,
  fetchPartnerTrevioTrips,
  savePartnerTrevioTrip,
  uploadTripImage,
} from "../../services/agentService";
import "./PartnerTrevioTrips.scss";

const STEPS = ["Basic", "Journey", "Inclusions", "Content", "Settings", "Review"];

const TRIP_CATEGORIES = [
  "weekend",
  "mountains",
  "beaches",
  "roadtrips",
  "international",
  "culture",
  "adventure",
];
const TRIP_TAGS = ["weekends", "mountains", "roadtrips", "international"];
const MAX_TAGS = 4;

const PREFERENCE_GROUPS = [
  ["roomTypes", "Room types"],
  ["mealPreferences", "Meal preferences"],
  ["packageTypes", "Package types"],
  ["drinkTypes", "Drink types"],
];

const categories = TRIP_CATEGORIES.map((value) => ({
  id: value,
  value,
  label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
}));
const statuses = ["draft", "pending_approval", "listed", "unpublished", "archived"].map(
  (value) => ({
    id: value,
    value,
    label: value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }),
);

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function coerceDuration(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const from = val.from || "";
    const to = val.to || "";
    if (from && to) return `${from} – ${to}`;
    return String(from || to);
  }
  return String(val);
}

function calcDuration(startStr, endStr) {
  if (!startStr || !endStr) return "";
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "";
  const diffMs = end - start;
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const nights = Math.max(0, totalDays - 1);
  return `${nights}N/${totalDays}D`;
}

function coercePhotos(initial) {
  const photos = Array.isArray(initial?.photos) ? [...initial.photos] : [];
  const image = initial?.image;
  if (image && !photos.includes(image)) photos.unshift(image);
  return photos;
}

function unwrapTripJson(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  for (const key of ["trip", "data", "result", "payload", "componentData"]) {
    const candidate = value[key];
    if (Array.isArray(candidate) && candidate.length === 1) return unwrapTripJson(candidate[0]);
    if (candidate && !Array.isArray(candidate) && typeof candidate === "object") {
      return unwrapTripJson(candidate);
    }
  }
  return value;
}

const blankTrip = {
  title: "",
  slug: "",
  category: "weekend",
  tag: "",
  location: "",
  country: "India",
  duration: "",
  startDate: null,
  endDate: null,
  dates: [],
  image: "",
  photos: [],
  description: "",
  chips: [],
  tags: [],
  price: { amount: 0, currency: "INR", tokenAmount: 1999, isFinal: true },
  availability: { totalSeats: null, seatsAvailable: null },
  preferences: {
    roomTypes: [
      { label: "Single", value: "single", extraPrice: 0 },
      { label: "Double", value: "double", extraPrice: 0 },
      { label: "Triple", value: "triple", extraPrice: 0 },
      { label: "Shared room with another traveller", value: "shared", extraPrice: -500 },
    ],
    mealPreferences: [
      { label: "Vegetarian", value: "veg", extraPrice: 0 },
      { label: "Non-Vegetarian", value: "nonveg", extraPrice: 500 },
      { label: "Vegan", value: "vegan", extraPrice: 0 },
      { label: "Jain", value: "jain", extraPrice: 0 },
    ],
    packageTypes: [
      {
        label: "Trip without flights",
        value: "without-flights",
        description: "Fixed itinerary and standard facilities without flights.",
        includesFlights: false,
        extraPrice: 0,
      },
      {
        label: "Trip with flights",
        value: "with-flights",
        description: "The same fixed itinerary and facilities with flights included.",
        includesFlights: true,
        extraPrice: 0,
      },
    ],
    drinkTypes: [
      { label: "Non-Alcoholic", value: "non-alcoholic", extraPrice: 0 },
      { label: "Alcoholic", value: "alcoholic", extraPrice: 2000 },
    ],
  },
  itinerary: [],
  inclusions: [],
  exclusions: [],
  featured: false,
  isListed: true,
  cancellationPolicy:
    "Full refund up to 7 days before departure; 50% refund within 7 days; no refund within 48 hours.",
  status: "draft",
  sortOrder: 0,
};

function ChipInput({ value = [], onChange, placeholder = "Add item" }) {
  const [input, setInput] = useState("");
  function add() {
    if (input.trim()) {
      onChange([...value, input.trim()]);
      setInput("");
    }
  }
  function remove(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }
  return (
    <div className="ptf-chip-input">
      <div className="ptf-chip-input__row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="small" onClick={add} text="Add" />
      </div>
      {value.length > 0 && (
        <div className="ptf-tag-list">
          {value.map((item, i) => (
            <span key={i} className="ptf-tag">
              {item}
              <Button
                type="button"
                variant="text"
                isCircular
                iconLeft="x"
                onClick={() => remove(i)}
                title="Remove"
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageUploader({
  uploading,
  uploadProgress,
  photo,
  photos = [],
  onUpload,
  onSetMain,
  onRemove,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (files) => {
      const selected = Array.from(files || []);
      if (selected.length > 0) onUpload(selected);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files);
    },
    [handleFile],
  );

  const allPhotos = photo ? [photo, ...photos.filter((url) => url !== photo)] : photos;

  return (
    <div className="ptf-image-uploader">
      <div
        className={`ptf-dropzone ${dragOver ? "ptf-dropzone--over" : ""} ${uploading ? "ptf-dropzone--uploading" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {uploading ? (
          <div className="ptf-upload-progress">
            <div className="ptf-progress-track">
              <div className="ptf-progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="ptf-upload-label">Uploading… {uploadProgress}%</span>
          </div>
        ) : photo ? (
          <img src={photo} alt="Main" className="ptf-dropzone-preview" />
        ) : (
          <div className="ptf-dropzone-placeholder">
            <span className="ptf-dropzone-icon">+</span>
            <span>Drop images here or click to browse</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          handleFile(e.target.files);
          e.target.value = "";
        }}
        hidden
      />

      {allPhotos.length > 0 && (
        <div className="ptf-photo-grid">
          {allPhotos.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`ptf-photo-thumb ${url === photo ? "ptf-photo-thumb--main" : ""}`}
            >
              <img src={url} alt="" />
              <Button
                type="button"
                primaryClassName="ptf-thumb-remove"
                variant="text"
                isCircular
                iconLeft="x"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(url);
                }}
                title="Remove"
              />
              {url !== photo && (
                <Button
                  type="button"
                  primaryClassName="ptf-thumb-setmain"
                  variant="text"
                  isCircular
                  iconLeft="star"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetMain(url);
                  }}
                  title="Set as main"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreferenceEditor({ preferences = {}, onChange }) {
  const updateGroup = (key, nextOptions) => onChange({ ...preferences, [key]: nextOptions });

  return (
    <div className="ptf-preferences">
      <SubTitle text="Booking preferences" />
      <p className="ptf-preference-help">
        Price adjustments may be positive surcharges, zero, or negative discounts.
      </p>
      {PREFERENCE_GROUPS.map(([key, label]) => {
        const options = Array.isArray(preferences[key]) ? preferences[key] : [];
        return (
          <fieldset key={key} className="ptf-pref-group">
            <legend>{label}</legend>
            {options.map((option, index) => (
              <div key={`${key}-${index}`} className="ptf-pref-option">
                <label>
                  Label
                  <input
                    value={option.label || ""}
                    onChange={(e) => {
                      const next = [...options];
                      next[index] = { ...option, label: e.target.value };
                      updateGroup(key, next);
                    }}
                  />
                </label>
                <label>
                  Value
                  <input
                    value={option.value || ""}
                    onChange={(e) => {
                      const next = [...options];
                      next[index] = { ...option, value: e.target.value };
                      updateGroup(key, next);
                    }}
                  />
                </label>
                <label>
                  Price adjustment
                  <input
                    type="number"
                    value={option.extraPrice ?? 0}
                    onChange={(e) => {
                      const next = [...options];
                      next[index] = { ...option, extraPrice: Number(e.target.value || 0) };
                      updateGroup(key, next);
                    }}
                  />
                </label>
                {key === "packageTypes" ? (
                  <>
                    <label>
                      Package details
                      <input
                        value={option.description || ""}
                        onChange={(e) => {
                          const next = [...options];
                          next[index] = { ...option, description: e.target.value };
                          updateGroup(key, next);
                        }}
                      />
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(option.includesFlights)}
                        onChange={(e) => {
                          const next = [...options];
                          next[index] = { ...option, includesFlights: e.target.checked };
                          updateGroup(key, next);
                        }}
                      />
                      Flights included
                    </label>
                  </>
                ) : null}
                <Button
                  type="button"
                  primaryClassName="ptf-pref-remove"
                  variant="text"
                  iconLeft="x"
                  aria-label={`Remove ${option.label || label} option`}
                  onClick={() =>
                    updateGroup(
                      key,
                      options.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={() =>
                updateGroup(key, [...options, { label: "", value: "", extraPrice: 0 }])
              }
              text="+ Add option"
            />
          </fieldset>
        );
      })}
    </div>
  );
}

function TripForm({ initial, onCancel, onSaved }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importingJson, setImportingJson] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [form, setFormState] = useState(() => {
    if (!initial) return blankTrip;
    const merged = {
      ...blankTrip,
      ...initial,
      price: { ...blankTrip.price, ...(initial.price || {}) },
      availability: { ...blankTrip.availability, ...(initial.availability || {}) },
      preferences: { ...blankTrip.preferences, ...(initial.preferences || {}) },
    };
    merged.duration =
      coerceDuration(initial.duration) || calcDuration(initial.startDate, initial.endDate);
    merged.photos = coercePhotos(initial);
    merged.image = initial.image || merged.photos[0] || "";
    return merged;
  });

  const set = (key, value) => {
    setDirty(true);
    setFormState((current) => ({ ...current, [key]: value }));
  };
  const setNested = (group, field, value) => {
    setDirty(true);
    setFormState((current) => ({ ...current, [group]: { ...current[group], [field]: value } }));
  };
  const setForm = (valueOrFn) => {
    setDirty(true);
    setFormState(valueOrFn);
  };

  function handleDateChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value || null };
      const start = field === "startDate" ? value : prev.startDate;
      const end = field === "endDate" ? value : prev.endDate;
      next.duration = calcDuration(start, end);
      if (end) {
        const endDate = new Date(end);
        const now = new Date();
        if (endDate < now && prev.status !== "completed" && prev.status !== "cancelled") {
          next.status = "completed";
        }
      }
      return next;
    });
  }

  function addArrayItem(key, item) {
    setDirty(true);
    setFormState((prev) => ({
      ...prev,
      [key]: [...(Array.isArray(prev[key]) ? prev[key] : []), item],
    }));
  }
  function updateArrayItem(key, idx, item) {
    setDirty(true);
    setFormState((prev) => {
      const copy = { ...prev };
      copy[key] = [...(copy[key] || [])];
      copy[key][idx] = item;
      return copy;
    });
  }
  function removeArrayItem(key, idx) {
    setDirty(true);
    setFormState((prev) => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== idx) }));
  }
  function moveArrayItem(key, fromIdx, toIdx) {
    setDirty(true);
    setFormState((prev) => {
      const copy = { ...prev };
      const arr = [...(copy[key] || [])];
      if (toIdx < 0 || toIdx >= arr.length) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      copy[key] = arr;
      return copy;
    });
  }

  function handleImportJson() {
    if (!String(jsonText || "").trim()) {
      setError("Paste a trip JSON object before importing.");
      return;
    }
    setError("");
    setImportingJson(true);
    try {
      const parsed = JSON.parse(jsonText);
      const imported = unwrapTripJson(parsed);
      if (!imported) throw new Error("The JSON must contain one trip object.");
      if (!imported.title && !imported.slug) {
        throw new Error("This does not look like a trip JSON. A title or slug is required.");
      }
      setFormState((prev) => {
        const next = {
          ...prev,
          ...imported,
          price: {
            ...prev.price,
            ...(typeof imported.price === "number"
              ? { amount: imported.price }
              : imported.price || {}),
          },
          availability: { ...prev.availability, ...(imported.availability || {}) },
          preferences: { ...(prev.preferences || {}), ...(imported.preferences || {}) },
        };
        next.slug = imported.slug || slugify(imported.title);
        next.duration =
          coerceDuration(imported.duration) || calcDuration(imported.startDate, imported.endDate);
        next.photos = coercePhotos(imported);
        next.image = imported.image || next.photos[0] || "";
        next.itinerary = Array.isArray(imported.itinerary) ? imported.itinerary : [];
        next.dates = Array.isArray(imported.dates) ? imported.dates : [];
        next.chips = Array.isArray(imported.chips) ? imported.chips : [];
        next.tags = Array.isArray(imported.tags) ? imported.tags : [];
        next.inclusions = Array.isArray(imported.inclusions) ? imported.inclusions : [];
        next.exclusions = Array.isArray(imported.exclusions) ? imported.exclusions : [];
        return next;
      });
      setDirty(true);
      setStep(0);
      setShowJsonImport(false);
      setJsonText("");
      setError("");
    } catch (importError) {
      setError(
        importError instanceof SyntaxError
          ? "The pasted content is not valid JSON. Check commas, quotes, and brackets."
          : importError.message || "Could not import this trip JSON.",
      );
    } finally {
      setImportingJson(false);
    }
  }

  function validateAll() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Trip title is required";
    if (!form.location.trim()) errs.location = "Destination is required";
    if (!form.category) errs.category = "Category is required";
    if (!form.price?.amount || Number(form.price.amount) <= 0)
      errs.price = "Price must be greater than 0";
    return errs;
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return;
    }
    setSaving(true);
    try {
      const payload = JSON.parse(JSON.stringify(form));
      payload.slug = payload.slug || slugify(payload.title);
      payload.price.amount = Number(payload.price.amount || 0);
      payload.price.tokenAmount = Number(payload.price.tokenAmount || 1999);
      payload.availability = {
        totalSeats:
          payload.availability?.totalSeats != null ? Number(payload.availability.totalSeats) : null,
        seatsAvailable:
          payload.availability?.seatsAvailable != null
            ? Number(payload.availability.seatsAvailable)
            : null,
      };
      payload.sortOrder = Number(payload.sortOrder || 0);
      payload.itinerary = (payload.itinerary || []).map((item, idx) => ({
        day: Number(item.day || idx + 1),
        title: item.title || "",
        summary: item.summary || "",
        location: item.location || "",
        activities: Array.isArray(item.activities) ? item.activities : [],
        meals: item.meals || "",
        accommodation: item.accommodation || "",
      }));
      payload.tags = Array.isArray(payload.tags) ? payload.tags : [];
      payload.chips = Array.isArray(payload.chips) ? payload.chips : [];
      payload.inclusions = Array.isArray(payload.inclusions) ? payload.inclusions : [];
      payload.exclusions = Array.isArray(payload.exclusions) ? payload.exclusions : [];
      payload.photos = Array.isArray(payload.photos) ? payload.photos.filter(Boolean) : [];
      payload.dates = Array.isArray(payload.dates) ? payload.dates : [];
      payload.isListed = payload.status === "listed" ? true : !!payload.isListed;

      if (payload.endDate) {
        const endDate = new Date(payload.endDate);
        const now = new Date();
        if (endDate < now && payload.status !== "completed" && payload.status !== "cancelled") {
          payload.status = "completed";
        }
      }

      await savePartnerTrevioTrip(payload);
      setDirty(false);
      onSaved();
    } catch (requestError) {
      setError(requestError.message || "Trip could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    onCancel();
  }

  async function handleUploadImage(files) {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const urls = [];
      for (let i = 0; i < list.length; i += 1) {
        const url = await uploadTripImage(list[i]);
        urls.push(url);
        setUploadProgress(Math.round(((i + 1) / list.length) * 100));
      }
      setForm((prev) => {
        const photos = [...(prev.photos || []), ...urls].filter(Boolean);
        return { ...prev, image: prev.image || urls[0] || "", photos };
      });
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function removePhoto(url) {
    setForm((prev) => {
      const photos = (prev.photos || []).filter((u) => u !== url);
      return { ...prev, image: prev.image === url ? photos[0] || "" : prev.image, photos };
    });
  }

  function setMainPhoto(url) {
    setForm((prev) => {
      const photos = [url, ...(prev.photos || []).filter((u) => u !== url)];
      return { ...prev, photos, image: url };
    });
  }

  useEffect(() => {
    if (!dirty) return;
    function handler(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const itineraryNextDay =
    (form.itinerary || []).reduce((max, day) => Math.max(max, day.day || 0), 0) + 1;

  return (
    <div
      className="ptf-root"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Edit Trevio trip" : "Create Trevio trip"}
    >
      <div className="ptf-panel">
        <header className="ptf-panel-header">
          <div>
            <span className="ptf-eyebrow">TREVIO INVENTORY</span>
            <SubTitle text={initial ? "Edit trip" : "Create a trip"} />
            <div className="ptf-steps">
              {STEPS.map((label, i) => (
                <span
                  key={label}
                  className={`ptf-step ${i === step ? "is-active" : ""} ${i < step ? "is-done" : ""}`}
                  title={label}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
          <div className="ptf-header-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowJsonImport((value) => !value)}
              disabled={importingJson}
              text={showJsonImport ? "Hide JSON" : "Paste JSON"}
            />
            <Button type="button" variant="text" onClick={handleCancel} text="Close" />
          </div>
        </header>

        <div className="ptf-panel-body">
          <form className="ptf-form" onSubmit={submit}>
            {error ? (
              <div className="ptf-feedback ptf-feedback--error" role="alert">
                {error}
              </div>
            ) : null}

            {showJsonImport && (
              <section className="ptf-json-import">
                <div className="ptf-json-import__heading">
                  <div>
                    <strong>Paste complete trip JSON</strong>
                    <span>
                      The object can be direct or wrapped in data, trip, result, payload, or
                      componentData.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => setJsonText("")}
                    disabled={!jsonText}
                    text="Clear"
                  />
                </div>
                <textarea
                  className="ptf-json-import__editor"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={
                    '{\n  "title": "Ladakh High Altitude Adventure",\n  "slug": "ladakh-high-altitude-adventure",\n  "category": "adventure",\n  ...\n}'
                  }
                  spellCheck={false}
                  aria-label="Trip JSON object"
                />
                <div className="ptf-json-import__actions">
                  <span>Use a valid role-safe template for an AI or manual completion.</span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setJsonText(getTripJsonTemplate())}
                    text="Get valid JSON object"
                  />
                  <Button
                    type="button"
                    variant="solid"
                    color="primary"
                    disabled={importingJson || !jsonText.trim()}
                    onClick={handleImportJson}
                    text={importingJson ? "Importing..." : "Apply JSON"}
                  />
                </div>
              </section>
            )}

            {step === 0 && (
              <section className="ptf-section">
                <div className="ptf-json-note">
                  <strong>Have a complete trip JSON?</strong>
                  <span>
                    Use Paste JSON above to fill all supported fields, then review each step before
                    submitting.
                  </span>
                </div>
                <div className="ptf-grid">
                  <InputField
                    label="Trip title"
                    required
                    value={form.title}
                    onChange={(value) => set("title", value)}
                    placeholder="Delhi to Leh Adventure"
                  />
                  <InputField
                    label="URL slug"
                    value={form.slug}
                    onChange={(value) => set("slug", slugify(value))}
                    placeholder={slugify(form.title) || "trip-url"}
                  />
                </div>
                <div className="ptf-grid">
                  <Dropdown
                    label="Category"
                    variant="select"
                    items={categories}
                    value={form.category}
                    onChange={(item) => set("category", item.value)}
                  />
                  <InputField
                    label="Display tag"
                    value={form.tag}
                    onChange={(value) => set("tag", value)}
                    placeholder="e.g. Mountain escape"
                  />
                </div>
                <div className="ptf-grid">
                  <InputField
                    label="Destination"
                    required
                    value={form.location}
                    onChange={(value) => set("location", value)}
                    placeholder="Leh, Ladakh"
                  />
                  <InputField
                    label="Country"
                    value={form.country}
                    onChange={(value) => set("country", value)}
                  />
                </div>
                <div className="ptf-grid">
                  <InputField
                    label="Duration (auto-calculated)"
                    value={form.duration}
                    onChange={(value) => set("duration", value)}
                    placeholder="e.g. 3N/4D"
                  />
                </div>
                <div className="ptf-grid">
                  <InputField
                    label="Start date"
                    variant="date"
                    value={form.startDate ? String(form.startDate).substring(0, 10) : ""}
                    onChange={(value) => handleDateChange("startDate", value || null)}
                  />
                  <InputField
                    label="End date"
                    variant="date"
                    value={form.endDate ? String(form.endDate).substring(0, 10) : ""}
                    onChange={(value) => handleDateChange("endDate", value || null)}
                  />
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="ptf-section">
                <SubTitle text="Itinerary" />
                {(form.itinerary || []).map((day, idx) => (
                  <div key={idx} className="ptf-array-card">
                    <div className="ptf-array-header">
                      <strong>Day {day.day || idx + 1}</strong>
                      <div className="ptf-array-actions">
                        <Button
                          type="button"
                          variant="outline"
                          size="small"
                          disabled={idx === 0}
                          onClick={() => moveArrayItem("itinerary", idx, idx - 1)}
                          text="▲"
                          title="Move up"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="small"
                          disabled={idx === (form.itinerary || []).length - 1}
                          onClick={() => moveArrayItem("itinerary", idx, idx + 1)}
                          text="▼"
                          title="Move down"
                        />
                        <Button
                          type="button"
                          variant="text"
                          size="small"
                          color="danger"
                          onClick={() => removeArrayItem("itinerary", idx)}
                          text="Remove"
                        />
                      </div>
                    </div>
                    <div className="ptf-grid">
                      <InputField
                        label="Day #"
                        variant="number"
                        value={String(day.day || "")}
                        onChange={(value) =>
                          updateArrayItem("itinerary", idx, { ...day, day: Number(value) })
                        }
                      />
                      <InputField
                        label="Title"
                        value={day.title || ""}
                        onChange={(value) =>
                          updateArrayItem("itinerary", idx, { ...day, title: value })
                        }
                      />
                    </div>
                    <label className="ptf-field">
                      Summary
                      <textarea
                        value={day.summary || ""}
                        onChange={(e) =>
                          updateArrayItem("itinerary", idx, { ...day, summary: e.target.value })
                        }
                      />
                    </label>
                    <div className="ptf-grid">
                      <InputField
                        label="Location"
                        value={day.location || ""}
                        onChange={(value) =>
                          updateArrayItem("itinerary", idx, { ...day, location: value })
                        }
                      />
                      <InputField
                        label="Meals"
                        value={day.meals || ""}
                        onChange={(value) =>
                          updateArrayItem("itinerary", idx, { ...day, meals: value })
                        }
                        placeholder="e.g. Breakfast, Dinner"
                      />
                    </div>
                    <InputField
                      label="Accommodation"
                      value={day.accommodation || ""}
                      onChange={(value) =>
                        updateArrayItem("itinerary", idx, { ...day, accommodation: value })
                      }
                      placeholder="e.g. Hotel"
                    />
                    <fieldset className="ptf-fieldset">
                      <legend>Activities</legend>
                      <ChipInput
                        value={day.activities || []}
                        onChange={(v) =>
                          updateArrayItem("itinerary", idx, { ...day, activities: v })
                        }
                        placeholder="Add activity"
                      />
                    </fieldset>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    addArrayItem("itinerary", {
                      day: itineraryNextDay,
                      title: "",
                      summary: "",
                      location: "",
                      activities: [],
                      meals: "",
                      accommodation: "",
                    })
                  }
                  text="+ Add Day"
                />
              </section>
            )}

            {step === 2 && (
              <section className="ptf-section">
                <fieldset className="ptf-fieldset">
                  <legend>Inclusions</legend>
                  <ChipInput
                    value={form.inclusions || []}
                    onChange={(v) => set("inclusions", v)}
                    placeholder="Add inclusion"
                  />
                </fieldset>
                <fieldset className="ptf-fieldset">
                  <legend>Exclusions</legend>
                  <ChipInput
                    value={form.exclusions || []}
                    onChange={(v) => set("exclusions", v)}
                    placeholder="Add exclusion"
                  />
                </fieldset>
                <fieldset className="ptf-fieldset">
                  <legend>Dates</legend>
                  <ChipInput
                    value={form.dates || []}
                    onChange={(v) => set("dates", v)}
                    placeholder="Add date string (e.g. Dec 15-18)"
                  />
                </fieldset>
                <PreferenceEditor
                  preferences={form.preferences || {}}
                  onChange={(preferences) => set("preferences", preferences)}
                />
              </section>
            )}

            {step === 3 && (
              <section className="ptf-section">
                <label className="ptf-field">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows="5"
                    placeholder="Describe the experience, route and important details."
                    required
                  />
                </label>
                <fieldset className="ptf-fieldset">
                  <legend>Photos</legend>
                  <ImageUploader
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    photo={form.image}
                    photos={form.photos || []}
                    onUpload={handleUploadImage}
                    onSetMain={setMainPhoto}
                    onRemove={removePhoto}
                  />
                  <details className="ptf-url-fallback">
                    <summary>Paste URL</summary>
                    <div className="ptf-paste-url">
                      <input
                        type="url"
                        placeholder="Image URL"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const url = e.target.value.trim();
                            if (url) {
                              setForm((prev) => ({
                                ...prev,
                                photos: [...(prev.photos || []), url],
                                image: prev.image || url,
                              }));
                              e.target.value = "";
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const url = e.target.value.trim();
                          if (url) {
                            setForm((prev) => ({
                              ...prev,
                              photos: [...(prev.photos || []), url],
                              image: prev.image || url,
                            }));
                            e.target.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="small"
                        text="Add"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector("input");
                          const url = (input?.value || "").trim();
                          if (url) {
                            setForm((prev) => ({
                              ...prev,
                              photos: [...(prev.photos || []), url],
                              image: prev.image || url,
                            }));
                            if (input) input.value = "";
                          }
                        }}
                      />
                    </div>
                  </details>
                </fieldset>
                <fieldset className="ptf-fieldset">
                  <legend>Tags (select up to {MAX_TAGS})</legend>
                  <div className="ptf-tag-toggle-list">
                    {[...new Set([...TRIP_TAGS, ...(form.tags || [])])].map((tag) => {
                      const selectedTags = form.tags || [];
                      const isSelected = selectedTags.includes(tag);
                      const selectionFull = selectedTags.length >= MAX_TAGS;
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`ptf-tag-toggle ${isSelected ? "is-selected" : ""}`}
                          aria-pressed={isSelected}
                          disabled={!isSelected && selectionFull}
                          onClick={() => {
                            const current = form.tags || [];
                            set(
                              "tags",
                              isSelected ? current.filter((t) => t !== tag) : [...current, tag],
                            );
                          }}
                        >
                          {isSelected && <span aria-hidden="true">✓</span>}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  {(form.tags || []).length >= MAX_TAGS && (
                    <small className="ptf-tag-limit">
                      Remove one selected tag to choose another.
                    </small>
                  )}
                </fieldset>
                <div className="ptf-grid">
                  <label className="ptf-check">
                    <input
                      type="checkbox"
                      checked={!!form.featured}
                      onChange={(e) => set("featured", e.target.checked)}
                    />{" "}
                    Featured
                  </label>
                  <label className="ptf-check">
                    <input
                      type="checkbox"
                      checked={!!form.isListed}
                      onChange={(e) => set("isListed", e.target.checked)}
                    />{" "}
                    Listed
                  </label>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="ptf-section">
                <div className="ptf-grid">
                  <InputField
                    label="Price (amount)"
                    required
                    variant="number"
                    value={String(form.price?.amount ?? 0)}
                    onChange={(value) => setNested("price", "amount", value)}
                  />
                  <InputField
                    label="Token amount"
                    variant="number"
                    value={String(form.price?.tokenAmount ?? 1999)}
                    onChange={(value) => setNested("price", "tokenAmount", value)}
                  />
                </div>
                <div className="ptf-grid">
                  <Dropdown
                    label="Publishing status"
                    variant="select"
                    items={statuses}
                    value={form.status}
                    onChange={(item) => set("status", item.value)}
                  />
                  <InputField
                    label="Sort order"
                    variant="number"
                    value={String(form.sortOrder ?? 0)}
                    onChange={(value) => set("sortOrder", value)}
                  />
                </div>
                <div className="ptf-grid">
                  <InputField
                    label="Total seats"
                    variant="number"
                    value={
                      form.availability?.totalSeats != null
                        ? String(form.availability.totalSeats)
                        : ""
                    }
                    onChange={(value) => setNested("availability", "totalSeats", value)}
                  />
                  <InputField
                    label="Seats available"
                    variant="number"
                    value={
                      form.availability?.seatsAvailable != null
                        ? String(form.availability.seatsAvailable)
                        : ""
                    }
                    onChange={(value) => setNested("availability", "seatsAvailable", value)}
                  />
                </div>
                <label className="ptf-field">
                  Cancellation Policy
                  <textarea
                    value={form.cancellationPolicy || ""}
                    onChange={(e) => set("cancellationPolicy", e.target.value)}
                    rows="4"
                  />
                </label>
              </section>
            )}

            {step === 5 && (
              <section className="ptf-section">
                <SubTitle text="Review & Submit" />
                <RecordReview
                  data={form}
                  title="Complete trip preview"
                  description="Check every trip value below. Use Back to make changes before submitting."
                />
              </section>
            )}
          </form>
        </div>

        <footer className="ptf-panel-footer">
          <div className="ptf-footer-left">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              text="Back"
            />
          </div>
          <div className="ptf-footer-actions">
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                variant="solid"
                color="primary"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                text="Next"
              />
            ) : (
              <Button
                type="submit"
                variant="solid"
                color="primary"
                onClick={submit}
                disabled={saving}
                text={saving ? "Saving..." : "Save trip"}
              />
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function TripViewModal({ trip, onClose, onEdit }) {
  if (!trip) return null;

  return (
    <div className="ptf-root" role="presentation" onMouseDown={onClose}>
      <section
        className="ptf-panel ptf-view-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`View ${trip.title || "Trevio trip"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ptf-panel-header">
          <div>
            <span className="ptf-eyebrow">TREVIO INVENTORY</span>
            <SubTitle text={trip.title || "Trip details"} />
          </div>
          <div className="ptf-header-actions">
            <Button
              type="button"
              variant="solid"
              color="primary"
              onClick={() => onEdit(trip)}
              text="Edit trip"
            />
            <Button type="button" variant="outline" onClick={onClose} text="Close" />
          </div>
        </header>
        <div className="ptf-panel-body">
          <RecordReview
            data={trip}
            title="Complete trip details"
            description="Review every stored value for this Trevio trip."
          />
        </div>
      </section>
    </div>
  );
}

export default function PartnerTrevioTrips({ session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const hasAccess = session?.user?.productAccess?.includes(PRODUCT_TYPE.TREVIO);
  const canApprove = session?.user?.agencyRole === "partner_admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTrips(await fetchPartnerTrevioTrips());
    } catch (requestError) {
      setError(requestError.message || "Trips could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (hasAccess) load();
  }, [hasAccess, load]);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("create") !== "true") return;
    navigate("/agent/services/tours/builder?product=trevio", { replace: true });
  }, [location.search, navigate]);

  const clearModalQuery = useCallback(() => {
    const params = new URLSearchParams(location.search);
    params.delete("create");
    const search = params.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ""}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    clearModalQuery();
  }, [clearModalQuery]);

  const visibleTrips = useMemo(
    () =>
      trips.filter((trip) => {
        const matchesSearch = `${trip.title} ${trip.location} ${trip.slug}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesSearch && (!status || trip.status === status);
      }),
    [query, status, trips],
  );

  if (!hasAccess)
    return (
      <main className="partner-trips-page">
        <EmptyState
          title="Trevio is not enabled"
          message="Ask your TravelsTREM account manager to add Trevio to your agency products."
        />
      </main>
    );

  return (
    <main className="partner-trips-page">
      <header className="partner-trips-page__header">
        <div>
          <span>PRODUCT OPERATIONS</span>
          <h1>Trevio trips</h1>
          <p>Create and maintain the curated trips owned by your agency.</p>
        </div>
        <Button
          primaryClassName="partner-trips-page__create"
          variant="solid"
          color="primary"
          onClick={() => {
            navigate("/agent/services/tours/builder?product=trevio");
          }}
          text="New trip"
        />
      </header>
      <section className="partner-trips-toolbar">
        <InputField
          value={query}
          onChange={setQuery}
          placeholder="Search by trip, destination or slug"
        />
        <Dropdown
          variant="select"
          label="Status"
          placeholder="All statuses"
          items={[{ id: "", value: "", label: "All statuses" }, ...statuses]}
          value={status}
          onChange={(item) => setStatus(item.value)}
        />
        <Button variant="outline" onClick={load} text="Refresh" />
      </section>
      {error ? (
        <div className="partner-trips-page__error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="partner-trips-page__loading">
          <Spinner label="Loading agency trips" />
        </div>
      ) : visibleTrips.length ? (
        <section className="partner-trip-grid">
          {visibleTrips.map((trip) => (
            <TrevioTripCard
              key={trip._id || trip.id}
              trip={trip}
              management
              ownershipMode="agent"
              labels={{ agent: "Added by agent", price: "Per person" }}
              onApprove={
                canApprove && trip.status === "pending_approval"
                  ? async (item) => {
                      setError("");
                      try {
                        await approvePartnerTrevioTrip(item);
                        await load();
                      } catch (actionError) {
                        setError(actionError.message || "Trip could not be approved.");
                      }
                    }
                  : undefined
              }
              onView={(item) => setViewing(item)}
              onEdit={(item) => {
                if (item.sourceTourId) {
                  navigate(`/agent/services/tours/builder?product=trevio&tourId=${item.sourceTourId}`);
                  return;
                }
                setViewing(null);
                setEditing(item);
                setFormOpen(true);
              }}
              deleteLabel={
                trip.status === "draft" || trip.status === "pending_approval" ? "Delete" : "Archive"
              }
              onDelete={async (item) => {
                const action =
                  item.status === "draft" || item.status === "pending_approval"
                    ? "Delete"
                    : "Archive";
                if (!window.confirm(`${action} ${item.title}?`)) return;
                try {
                  await deletePartnerTrevioTrip(item._id);
                  await load();
                } catch (actionError) {
                  setError(actionError.message || "Trip could not be removed.");
                }
              }}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No Trevio trips found"
          message="Create your agency's first curated trip or adjust the current filters."
        />
      )}
      {viewing ? (
        <TripViewModal
          trip={viewing}
          onClose={() => setViewing(null)}
          onEdit={(item) => {
            if (item.sourceTourId) {
              navigate(`/agent/services/tours/builder?product=trevio&tourId=${item.sourceTourId}`);
              return;
            }
            setViewing(null);
            setEditing(item);
            setFormOpen(true);
          }}
        />
      ) : null}
      {formOpen ? (
        <TripForm
          initial={editing}
          onCancel={closeForm}
          onSaved={() => {
            closeForm();
            load();
          }}
        />
      ) : null}
    </main>
  );
}
