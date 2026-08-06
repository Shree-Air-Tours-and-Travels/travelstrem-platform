import React, { useRef, useCallback, useState } from "react";
import { Button, SubTitle, RecordReview } from "@packages/trem-ui";
import { getTripJsonTemplate } from "@packages/trem-utils";
import "../tours/CreateTourForm.scss";

const STEPS = ['Basic', 'Journey', 'Inclusions', 'Content', 'Settings', 'Review'];

const PREFERENCE_GROUPS = [
    ["roomTypes", "Room types"],
    ["mealPreferences", "Meal preferences"],
    ["packageTypes", "Package types"],
    ["drinkTypes", "Drink types"],
];

function ChipInput({ value = [], onChange, placeholder = "Add item" }) {
    const [input, setInput] = useState("");
    function add() {
        if (input.trim()) { onChange([...value, input.trim()]); setInput(""); }
    }
    function remove(idx) { onChange(value.filter((_, i) => i !== idx)); }
    return (
        <div>
            <div style={{ display: "flex", gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} />
                <Button type="button" primaryClassName="btn" onClick={add} text="Add" />
            </div>
            <div className="ctf-tag-list">
                {value.map((item, i) => (
                    <span key={i} className="ctf-tag">
                        {item}
                        <Button type="button" variant="text" isCircular iconLeft="x" onClick={() => remove(i)} />
                    </span>
                ))}
            </div>
        </div>
    );
}

function ImageDropzone({ uploading, onUpload }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = useCallback(files => {
        const f = Array.from(files || []);
        if (f.length > 0) onUpload(f[0]);
    }, [onUpload]);

    return (
        <div className="ctf-image-uploader">
            <div
                className={`ctf-dropzone ${dragOver ? "ctf-dropzone--over" : ""} ${uploading ? "ctf-dropzone--uploading" : ""}`}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
                onClick={() => !uploading && inputRef.current?.click()}
                role="button"
                tabIndex={0}
            >
                {uploading ? (
                    <div className="ctf-upload-progress"><span className="ctf-upload-label">Uploading...</span></div>
                ) : (
                    <div className="ctf-dropzone-placeholder">
                        <span className="ctf-dropzone-icon">+</span>
                        <span>Drop image or click to browse</span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={e => { handleFile(e.target.files); e.target.value = ""; }} hidden />
        </div>
    );
}

function PhotoGrid({ photos, image, onRemove, onSetMain }) {
    if (!photos || photos.length === 0) return null;
    return (
        <div className="ctf-photo-grid">
            {photos.map((url, idx) => (
                <div key={idx} className={`ctf-photo-thumb ${url === image ? "ctf-photo-thumb--main" : ""}`}>
                    <img src={url} alt={`Photo ${idx + 1}`} />
                    <button className="ctf-thumb-remove" type="button" onClick={() => onRemove(idx)} title="Remove">x</button>
                    {url !== image && (
                        <button className="ctf-thumb-setmain" type="button" onClick={() => onSetMain(idx)} title="Set as main">★</button>
                    )}
                </div>
            ))}
        </div>
    );
}

function PreferenceEditor({ preferences = {}, onChange }) {
    const updateGroup = (key, nextOptions) => onChange({ ...preferences, [key]: nextOptions });

    return (
        <div className="ctf-preferences">
            <SubTitle text="Booking preferences" />
            <p className="ctf-preferences__help">Price adjustments may be positive surcharges, zero, or negative discounts.</p>
            {PREFERENCE_GROUPS.map(([key, label]) => {
                const options = Array.isArray(preferences[key]) ? preferences[key] : [];
                return (
                    <fieldset key={key} className="ctf-preference-group">
                        <legend>{label}</legend>
                        {options.map((option, index) => (
                            <div key={`${key}-${index}`} className="ctf-preference-option">
                                <label>Label
                                    <input
                                        value={option.label || ""}
                                        onChange={e => {
                                            const next = [...options];
                                            next[index] = { ...option, label: e.target.value };
                                            updateGroup(key, next);
                                        }}
                                    />
                                </label>
                                <label>Value
                                    <input
                                        value={option.value || ""}
                                        onChange={e => {
                                            const next = [...options];
                                            next[index] = { ...option, value: e.target.value };
                                            updateGroup(key, next);
                                        }}
                                    />
                                </label>
                                <label>Price adjustment
                                    <input
                                        type="number"
                                        value={option.extraPrice ?? 0}
                                        onChange={e => {
                                            const next = [...options];
                                            next[index] = { ...option, extraPrice: Number(e.target.value || 0) };
                                            updateGroup(key, next);
                                        }}
                                    />
                                </label>
                                <Button
                                    type="button"
                                    primaryClassName="btn ctf-preference-remove"
                                    variant="text"
                                    iconLeft="x"
                                    aria-label={`Remove ${option.label || label} option`}
                                    onClick={() => updateGroup(key, options.filter((_, itemIndex) => itemIndex !== index))}
                                />
                            </div>
                        ))}
                        <Button
                            type="button"
                            primaryClassName="btn"
                            variant="outline"
                            onClick={() => updateGroup(key, [...options, { label: "", value: "", extraPrice: 0 }])}
                            text="+ Add option"
                        />
                    </fieldset>
                );
            })}
        </div>
    );
}

export default function CreateTripFormView({
    form, step, saving, uploading, importingJson, error, success, onCancel, submit, next, back,
    setForm, setAt, handleDateChange, addArrayItem, updateArrayItem, removeArrayItem, moveArrayItem,
    handleUploadImage, handleImportJson, removePhoto, setMainPhoto, TRIP_TAGS, TRIP_CATEGORIES,
}) {
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [jsonText, setJsonText] = useState("");

    return (
        <aside className="ctf-root-overlay">
            <div className="ctf-panel">
                <header className="ctf-panel-header">
                    <div>
                        <SubTitle text={form._id ? "Edit Trip" : "Create Trip"} />
                        <div className="ctf-steps-line">
                            {STEPS.map((s, i) => <span key={s} className={`ctf-step ${i === step ? "active" : i < step ? "done" : ""}`}>{i + 1}</span>)}
                        </div>
                    </div>
                    <div className="ctf-header-actions">
                        <Button
                            type="button"
                            primaryClassName="btn ctf-json-import-button"
                            variant="outline"
                            onClick={() => setShowJsonImport(value => !value)}
                            disabled={importingJson}
                            text={showJsonImport ? "Hide JSON" : "Paste JSON"}
                        />
                        <Button primaryClassName="btn" onClick={onCancel} text="Cancel" />
                    </div>
                </header>

                <div className="ctf-panel-body">
                    <form onSubmit={submit} className="ctf-form-inner">
                        {error && <div className="ctf-feedback ctf-feedback--error">{error}</div>}
                        {success && <div className="ctf-feedback ctf-feedback--ok">{success}</div>}

                        {showJsonImport && (
                            <section className="ctf-json-import">
                                <div className="ctf-json-import__heading">
                                    <div>
                                        <strong>Paste complete trip JSON</strong>
                                        <span>The object can be direct or wrapped in data, trip, result, payload, or componentData.</span>
                                    </div>
                                    <Button
                                        type="button"
                                        primaryClassName="btn"
                                        variant="text"
                                        onClick={() => setJsonText("")}
                                        disabled={!jsonText}
                                        text="Clear"
                                    />
                                </div>
                                <textarea
                                    className="ctf-json-import__editor"
                                    value={jsonText}
                                    onChange={e => setJsonText(e.target.value)}
                                    placeholder={'{\n  "title": "Ladakh High Altitude Adventure",\n  "slug": "ladakh-high-altitude-adventure",\n  "category": "adventure",\n  ...\n}'}
                                    spellCheck={false}
                                    aria-label="Trip JSON object"
                                />
                                <div className="ctf-json-import__actions">
                                    <span>Use a valid role-safe template for an AI or manual completion.</span>
                                    <Button type="button" primaryClassName="btn" variant="outline" onClick={() => setJsonText(getTripJsonTemplate({ master: true }))} text="Get valid JSON object" />
                                    <Button
                                        type="button"
                                        primaryClassName="btn"
                                        variant="solid"
                                        color="primary"
                                        disabled={importingJson || !jsonText.trim()}
                                        onClick={() => {
                                            if (handleImportJson(jsonText)) {
                                                setShowJsonImport(false);
                                                setJsonText("");
                                            }
                                        }}
                                        text={importingJson ? "Importing..." : "Apply JSON"}
                                    />
                                </div>
                            </section>
                        )}

                        {step === 0 && (
                            <section className="ctf-section">
                                <div className="ctf-json-import-note">
                                    <strong>Have a complete trip JSON?</strong>
                                    <span>Use Paste JSON above to fill all supported fields, then review each step before submitting.</span>
                                </div>
                                <label>Title
                                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                </label>
                                <label>Slug (auto-generated)
                                    <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-title" />
                                </label>
                                <div className="ctf-row">
                                    <label>Category
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            {TRIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </label>
                                    <label>Display tag
                                        <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Mountain escape" />
                                    </label>
                                </div>
                                <div className="ctf-row">
                                    <label>Location
                                        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                                    </label>
                                    <label>Country
                                        <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                                    </label>
                                </div>
                                <label>Duration (auto-calculated)
                                    <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3N/4D" />
                                </label>
                                <div className="ctf-row">
                                    <label>Start date
                                        <input type="date" value={form.startDate ? form.startDate.substring(0, 10) : ""} onChange={e => handleDateChange("startDate", e.target.value || null)} />
                                    </label>
                                    <label>End date
                                        <input type="date" value={form.endDate ? form.endDate.substring(0, 10) : ""} onChange={e => handleDateChange("endDate", e.target.value || null)} />
                                    </label>
                                </div>
                            </section>
                        )}

                        {step === 1 && (
                            <section className="ctf-section">
                                <SubTitle text="Itinerary" />
                                {(form.itinerary || []).map((day, idx) => (
                                    <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem", marginBottom: "0.75rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                            <strong>Day {day.day || idx + 1}</strong>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <Button type="button" primaryClassName="btn" disabled={idx === 0} onClick={() => moveArrayItem("itinerary", idx, idx - 1)} text="▲" />
                                                <Button type="button" primaryClassName="btn" disabled={idx === (form.itinerary || []).length - 1} onClick={() => moveArrayItem("itinerary", idx, idx + 1)} text="▼" />
                                                <Button type="button" primaryClassName="btn" onClick={() => removeArrayItem("itinerary", idx)} text="Remove" />
                                            </div>
                                        </div>
                                        <label>Day #<input type="number" min={1} value={day.day || ""} onChange={e => updateArrayItem("itinerary", idx, { ...day, day: Number(e.target.value) })} /></label>
                                        <label>Title<input value={day.title || ""} onChange={e => updateArrayItem("itinerary", idx, { ...day, title: e.target.value })} /></label>
                                        <label>Summary<textarea value={day.summary || ""} onChange={e => updateArrayItem("itinerary", idx, { ...day, summary: e.target.value })} /></label>
                                        <label>Location<input value={day.location || ""} onChange={e => updateArrayItem("itinerary", idx, { ...day, location: e.target.value })} /></label>
                                        <div className="ctf-row">
                                            <label>Meals<input value={day.meals || ""} onChange={e => updateArrayItem("itinerary", idx, { ...day, meals: e.target.value })} placeholder="e.g. Breakfast, Dinner" /></label>
                                            <label>Accommodation<input value={day.accommodation || ""} onChange={e => updateArrayItem("itinerary", idx, { ...day, accommodation: e.target.value })} placeholder="e.g. Hotel" /></label>
                                        </div>
                                        <fieldset><legend>Activities</legend>
                                            <ChipInput value={day.activities || []} onChange={v => updateArrayItem("itinerary", idx, { ...day, activities: v })} placeholder="Add activity" />
                                        </fieldset>
                                    </div>
                                ))}
                                <Button type="button" primaryClassName="btn" onClick={() => {
                                    const nextDay = ((form.itinerary || []).reduce((max, d) => Math.max(max, d.day || 0), 0)) + 1;
                                    addArrayItem("itinerary", { day: nextDay, title: "", summary: "", location: "", activities: [], meals: "", accommodation: "" });
                                }} text="+ Add Day" />
                            </section>
                        )}

                        {step === 2 && (
                            <section className="ctf-section">
                                <fieldset><legend>Inclusions</legend>
                                    <ChipInput value={form.inclusions || []} onChange={v => setForm({ ...form, inclusions: v })} placeholder="Add inclusion" />
                                </fieldset>
                                <fieldset style={{ marginTop: 12 }}><legend>Exclusions</legend>
                                    <ChipInput value={form.exclusions || []} onChange={v => setForm({ ...form, exclusions: v })} placeholder="Add exclusion" />
                                </fieldset>
                                <fieldset style={{ marginTop: 12 }}><legend>Dates</legend>
                                    <ChipInput value={form.dates || []} onChange={v => setForm({ ...form, dates: v })} placeholder="Add date string (e.g. Dec 15-18)" />
                                </fieldset>
                                <PreferenceEditor
                                    preferences={form.preferences || {}}
                                    onChange={preferences => setForm({ ...form, preferences })}
                                />
                            </section>
                        )}

                        {step === 3 && (
                            <section className="ctf-section">
                                <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></label>
                                <fieldset>
                                    <legend>Photos</legend>
                                    <ImageDropzone uploading={uploading} onUpload={handleUploadImage} />
                                    <details className="ctf-url-fallback" style={{ marginTop: 8 }}>
                                        <summary>Paste URL</summary>
                                        <input value="" onChange={e => { if (e.target.value.trim()) { setForm(prev => ({ ...prev, photos: [...prev.photos, e.target.value.trim()], image: prev.image || e.target.value.trim() })); e.target.value = ""; } }} placeholder="Image URL" />
                                    </details>
                                    <PhotoGrid photos={form.photos} image={form.image} onRemove={removePhoto} onSetMain={setMainPhoto} />
                                </fieldset>
                                <fieldset style={{ marginTop: 12 }}>
                                    <legend>Tags (select up to 4)</legend>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {[...new Set([...TRIP_TAGS, ...(form.tags || [])])].map(tag => {
                                            const selectedTags = form.tags || [];
                                            const isSelected = selectedTags.includes(tag);
                                            const selectionFull = selectedTags.length >= 4;
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    className={`ctf-tag-toggle ${isSelected ? "is-selected" : ""}`}
                                                    aria-pressed={isSelected}
                                                    disabled={!isSelected && selectionFull}
                                                    onClick={() => {
                                                        const current = form.tags || [];
                                                        setForm({
                                                            ...form,
                                                            tags: isSelected
                                                                ? current.filter(currentTag => currentTag !== tag)
                                                                : [...current, tag],
                                                        });
                                                    }}
                                                >
                                                    {isSelected && <span aria-hidden="true">✓</span>}
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {(form.tags || []).length >= 4 && <small className="ctf-tag-limit">Remove one selected tag to choose another.</small>}
                                </fieldset>
                                <div className="ctf-row" style={{ marginTop: 12 }}>
                                    <label><input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
                                    <label><input type="checkbox" checked={!!form.isListed} onChange={e => setForm({ ...form, isListed: e.target.checked })} /> Listed</label>
                                </div>
                            </section>
                        )}

                        {step === 4 && (
                            <section className="ctf-section">
                                <div className="ctf-row">
                                    <label>Price (amount)
                                        <input type="number" min={0} value={form.price?.amount || 0} onChange={e => setAt("price.amount", Number(e.target.value))} required />
                                    </label>
                                    <label>Token amount
                                        <input type="number" min={0} value={form.price?.tokenAmount || 1999} onChange={e => setAt("price.tokenAmount", Number(e.target.value))} />
                                    </label>
                                </div>
                                <div className="ctf-row">
                                    <label>Status
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option value="draft">Draft</option>
                                            <option value="listed">Listed</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </label>
                                </div>
                                <label>Cancellation Policy<textarea value={form.cancellationPolicy} onChange={e => setForm({ ...form, cancellationPolicy: e.target.value })} /></label>
                                <div className="ctf-row">
                                    <label>Total seats
                                        <input type="number" min={0} value={form.availability?.totalSeats ?? ""} onChange={e => setAt("availability.totalSeats", e.target.value ? Number(e.target.value) : null)} />
                                    </label>
                                    <label>Sort order
                                        <input type="number" value={form.sortOrder || 0} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                                    </label>
                                </div>
                            </section>
                        )}

                        {step === 5 && (
                            <section className="ctf-section">
                                <SubTitle text="Review & Submit" />
                                <RecordReview data={form} title="Complete trip preview" description="Check every trip value below. Use Back to make changes before submitting." />
                            </section>
                        )}
                    </form>
                </div>

                <footer className="ctf-panel-footer">
                    <div className="ctf-footer-left">
                        <Button primaryClassName="btn" disabled={step === 0} onClick={back} text="Back" />
                    </div>
                    <div className="ctf-footer-actions">
                        {step < STEPS.length - 1 ? (
                            <Button primaryClassName="btn" variant="solid" color="primary" onClick={next} text="Next" />
                        ) : (
                            <Button primaryClassName="btn" variant="solid" color="primary" type="submit" onClick={submit} disabled={saving} text={saving ? "Saving..." : "Submit"} />
                        )}
                    </div>
                </footer>
            </div>
        </aside>
    );
}
