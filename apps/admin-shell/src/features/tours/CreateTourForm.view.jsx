import React, { useState, useRef, useCallback } from "react";
import "./CreateTourForm.scss";

const STEPS = ['Basic', 'Schedule', 'Itinerary', 'Pricing', 'Logistics', 'Content', 'Review'];

function ChipInput({ value = [], onChange, placeholder = "Add item" }) {
    const [input, setInput] = useState('');
    function add() {
        if (input.trim()) {
            onChange([...value, input.trim()]);
            setInput('');
        }
    }
    function remove(idx) {
        onChange(value.filter((_, i) => i !== idx));
    }
    return (
        <div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder}
                />
                <button type="button" className="btn" onClick={add}>Add</button>
            </div>
            <div className="ctf-tag-list">
                {value.map((item, i) => (
                    <span key={i} className="ctf-tag">
                        {item}
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: '1.1em', lineHeight: 1 }}
                        >×</button>
                    </span>
                ))}
            </div>
        </div>
    );
}

const errClass = (name, touched, fieldErrors) =>
    touched?.[name] && fieldErrors?.[name] ? 'ctf-input-error' : '';

const fieldErr = (name, touched, fieldErrors) =>
    touched?.[name] && fieldErrors?.[name] ? (
        <div className="ctf-field-err">{fieldErrors[name]}</div>
    ) : null;

function ImageUploader({ uploading, uploadProgress, photo, photos = [], onUpload, onSetMain, onRemove }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = useCallback(files => {
        const file = files?.[0];
        if (file) onUpload(file);
    }, [onUpload]);

    const handleDrop = useCallback(e => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files);
    }, [handleFile]);

    const handleDragOver = useCallback(e => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(e => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const allPhotos = photo ? [photo, ...photos.filter(u => u !== photo)] : photos;

    return (
        <div className="ctf-image-uploader">
            <div
                className={`ctf-dropzone ${dragOver ? 'ctf-dropzone--over' : ''} ${uploading ? 'ctf-dropzone--uploading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !uploading && inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
            >
                {uploading ? (
                    <div className="ctf-upload-progress">
                        <div className="ctf-progress-track">
                            <div className="ctf-progress-bar" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <span className="ctf-upload-label">Uploading… {uploadProgress}%</span>
                    </div>
                ) : photo ? (
                    <img src={photo} alt="Main" className="ctf-dropzone-preview" />
                ) : (
                    <div className="ctf-dropzone-placeholder">
                        <span className="ctf-dropzone-icon">+</span>
                        <span>Drop image here or click to browse</span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={e => { handleFile(e.target.files); e.target.value = ''; }} hidden />

            {allPhotos.length > 0 && (
                <div className="ctf-photo-grid">
                    {allPhotos.map((url, i) => (
                        <div key={i} className={`ctf-photo-thumb ${url === photo ? 'ctf-photo-thumb--main' : ''}`}>
                            <img src={url} alt={`Photo ${i + 1}`} />
                            <button
                                type="button"
                                className="ctf-thumb-remove"
                                onClick={e => { e.stopPropagation(); onRemove(url); }}
                                title="Remove"
                            >×</button>
                            {url !== photo && (
                                <button
                                    type="button"
                                    className="ctf-thumb-setmain"
                                    onClick={e => { e.stopPropagation(); onSetMain(url); }}
                                    title="Set as main"
                                >★</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CreateTourFormView({
    form, step, saving, uploading, uploadProgress, error, success, onCancel, submit, next, back,
    setForm, setAt, addArrayItem, updateArrayItem, removeArrayItem, moveArrayItem, handleUploadImage,
    touched, fieldErrors, seasonOverlaps, handleBlur, onDismissSuccess,
}) {
    React.useEffect(() => {
        if (success) {
            const t = setTimeout(onDismissSuccess, 4000);
            return () => clearTimeout(t);
        }
    }, [success, onDismissSuccess]);
    return (
        <aside className="ctf-root-overlay">
            <div className="ctf-panel">
                <header className="ctf-panel-header">
                    <div>
                        <h3>{form._id ? 'Edit Tour' : 'Create Tour'}</h3>
                        <div className="ctf-steps-line">
                            {STEPS.map((s, i) => <span key={s} className={`ctf-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>{i + 1}</span>)}
                        </div>
                    </div>
                    <div className="ctf-header-actions">
                        <button className="btn" onClick={onCancel}>Cancel</button>
                    </div>
                </header>

                <div className="ctf-panel-body">
                    <form onSubmit={submit} className="ctf-form-inner">
                        {error && <div className="ctf-feedback ctf-feedback--error">{error}</div>}
                        {success && <div className="ctf-feedback ctf-feedback--ok">{success}</div>}

                        {step === 0 && (
                            <section className="ctf-section">
                                <label>Title
                                    <input
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        onBlur={() => handleBlur?.('title')}
                                        className={errClass('title', touched, fieldErrors)}
                                        required
                                    />
                                </label>
                                {fieldErr('title', touched, fieldErrors)}
                                <div className="ctf-row">
                                    <label>From
                                        <input
                                            value={form.city.from}
                                            onChange={e => setAt('city.from', e.target.value)}
                                            onBlur={() => handleBlur?.('city.from')}
                                            className={errClass('city.from', touched, fieldErrors)}
                                            required
                                        />
                                    </label>
                                    <label>To
                                        <input
                                            value={form.city.to}
                                            onChange={e => setAt('city.to', e.target.value)}
                                            onBlur={() => handleBlur?.('city.to')}
                                            className={errClass('city.to', touched, fieldErrors)}
                                            required
                                        />
                                    </label>
                                </div>
                                {fieldErr('city.from', touched, fieldErrors) || fieldErr('city.to', touched, fieldErrors)}
                                <fieldset>
                                    <legend>Address</legend>
                                    <label>Line1<input value={form.address.line1} onChange={e => setAt('address.line1', e.target.value)} /></label>
                                    <label>Line2<input value={form.address.line2} onChange={e => setAt('address.line2', e.target.value)} /></label>
                                    <div className="ctf-row">
                                        <label>City<input value={form.address.city} onChange={e => setAt('address.city', e.target.value)} /></label>
                                        <label>State<input value={form.address.state} onChange={e => setAt('address.state', e.target.value)} /></label>
                                    </div>
                                    <div className="ctf-row">
                                        <label>Zip<input value={form.address.zip} onChange={e => setAt('address.zip', e.target.value)} /></label>
                                        <label>Country<input value={form.address.country} onChange={e => setAt('address.country', e.target.value)} /></label>
                                    </div>
                                </fieldset>
                                <label>Distance (km)
                                    <input
                                        type="number" min={0}
                                        value={form.distance}
                                        onChange={e => setForm({ ...form, distance: e.target.value })}
                                        onBlur={() => handleBlur?.('distance')}
                                        className={errClass('distance', touched, fieldErrors)}
                                        required
                                    />
                                </label>
                                {fieldErr('distance', touched, fieldErrors)}
                            </section>
                        )}

                        {step === 1 && (
                            <section className="ctf-section">
                                <div className="ctf-row">
                                    <label>Start Date<input type="date" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value || null })} /></label>
                                    <label>End Date<input type="date" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value || null })} /></label>
                                </div>
                                <div className="ctf-row">
                                    <label>Days
                                        <input
                                            type="number" min={1}
                                            value={form.period.days}
                                            onChange={e => setAt('period.days', Number(e.target.value))}
                                            onBlur={() => handleBlur?.('period.days')}
                                            className={errClass('period.days', touched, fieldErrors)}
                                            required
                                        />
                                    </label>
                                    <label>Nights
                                        <input
                                            type="number" min={0}
                                            value={form.period.nights}
                                            onChange={e => setAt('period.nights', Number(e.target.value))}
                                            onBlur={() => handleBlur?.('period.nights')}
                                            className={errClass('period.nights', touched, fieldErrors)}
                                            required
                                        />
                                    </label>
                                </div>
                                {fieldErr('period.days', touched, fieldErrors) || fieldErr('period.nights', touched, fieldErrors)}
                            </section>
                        )}

                        {step === 2 && (
                            <section className="ctf-section">
                                <h4 style={{ margin: '0 0 0.75rem' }}>Itinerary Days</h4>
                                {(form.itinerary || []).map((day, idx) => (
                                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <strong>Day {day.day || idx + 1}</strong>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button type="button" className="btn" disabled={idx === 0} onClick={() => moveArrayItem?.('itinerary', idx, idx - 1)}>▲</button>
                                                <button type="button" className="btn" disabled={idx === (form.itinerary || []).length - 1} onClick={() => moveArrayItem?.('itinerary', idx, idx + 1)}>▼</button>
                                                <button type="button" className="btn" onClick={() => removeArrayItem('itinerary', idx)}>Remove</button>
                                            </div>
                                        </div>
                                        <label>Day #<input type="number" min={1} value={day.day || ''} onChange={e => updateArrayItem('itinerary', idx, { ...day, day: Number(e.target.value) })} /></label>
                                        <label>Title<input value={day.title || ''} onChange={e => updateArrayItem('itinerary', idx, { ...day, title: e.target.value })} /></label>
                                        <label>Summary<textarea value={day.summary || ''} onChange={e => updateArrayItem('itinerary', idx, { ...day, summary: e.target.value })} /></label>
                                        <fieldset><legend>Activities</legend>
                                            <ChipInput value={day.activities || []} onChange={v => updateArrayItem('itinerary', idx, { ...day, activities: v })} placeholder="Add activity" />
                                        </fieldset>
                                        <fieldset style={{ marginTop: 8 }}><legend>Meals</legend>
                                            <ChipInput value={day.meals || []} onChange={v => updateArrayItem('itinerary', idx, { ...day, meals: v })} placeholder="Add meal" />
                                        </fieldset>
                                        <label>Accommodation<input value={day.accommodation || ''} onChange={e => updateArrayItem('itinerary', idx, { ...day, accommodation: e.target.value })} /></label>
                                        <label>Location<input value={day.location || ''} onChange={e => updateArrayItem('itinerary', idx, { ...day, location: e.target.value })} /></label>
                                        <label>Notes<textarea value={day.notes || ''} onChange={e => updateArrayItem('itinerary', idx, { ...day, notes: e.target.value })} /></label>
                                    </div>
                                ))}
                                <button type="button" className="btn" onClick={() => {
                                    const nextDay = ((form.itinerary || []).reduce((max, d) => Math.max(max, d.day || 0), 0)) + 1;
                                    addArrayItem('itinerary', { day: nextDay, title: '', summary: '', activities: [], meals: [], accommodation: '', location: '', notes: '' });
                                }}>+ Add Day</button>
                            </section>
                        )}

                        {step === 3 && (
                            <section className="ctf-section">
                                <div className="ctf-row">
                                    <label>Min price
                                        <input
                                            type="number"
                                            value={form.price.min}
                                            onChange={e => setAt('price.min', Number(e.target.value))}
                                            onBlur={() => handleBlur?.('price.min')}
                                            className={errClass('price.min', touched, fieldErrors)}
                                            required
                                        />
                                    </label>
                                    <label>Max price
                                        <input
                                            type="number"
                                            value={form.price.max}
                                            onChange={e => setAt('price.max', Number(e.target.value))}
                                            onBlur={() => handleBlur?.('price.max')}
                                            className={errClass('price.max', touched, fieldErrors)}
                                            required
                                        />
                                    </label>
                                </div>
                                {fieldErr('price.min', touched, fieldErrors) || fieldErr('price.max', touched, fieldErrors)}
                                <fieldset>
                                    <legend>Seasonal Pricing</legend>
                                    {seasonOverlaps?.map((o, i) => (
                                        <div key={i} className="ctf-feedback ctf-feedback--error" style={{ marginBottom: 8, fontSize: '0.85rem' }}>{o.msg}</div>
                                    ))}
                                    {(form.seasonalPricing || []).map((s, idx) => {
                                        const isOverlap = seasonOverlaps?.some(o => o.idxA === idx || o.idxB === idx);
                                        return (
                                            <div key={idx} className="ctf-array" style={isOverlap ? { border: '1px solid var(--color-danger)', borderRadius: 6, padding: 4 } : {}}>
                                                <input value={s.seasonName || ''} placeholder="name" onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, seasonName: e.target.value })} />
                                                <input type="date" value={s.startDate || ''} onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, startDate: e.target.value })} />
                                                <input type="date" value={s.endDate || ''} onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, endDate: e.target.value })} />
                                                <button type="button" className="btn" onClick={() => removeArrayItem('seasonalPricing', idx)}>Remove</button>
                                            </div>
                                        );
                                    })}
                                    <button type="button" className="btn" onClick={() => addArrayItem('seasonalPricing', { seasonName: '', startDate: '', endDate: '', min: form.price.min, max: form.price.max })}>Add season</button>
                                </fieldset>
                            </section>
                        )}

                        {step === 4 && (
                            <section className="ctf-section">
                                <label>Description<textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} required /></label>

                                <fieldset>
                                    <legend>Main Photo</legend>
                                    <ImageUploader
                                        uploading={uploading}
                                        uploadProgress={uploadProgress}
                                        photo={form.photo}
                                        photos={form.photos}
                                        onUpload={handleUploadImage}
                                        onSetMain={url => setForm({ ...form, photo: url })}
                                        onRemove={url => {
                                            const next = (form.photos || []).filter(u => u !== url);
                                            setForm({ ...form, photo: form.photo === url ? (next[0] || '') : form.photo, photos: next });
                                        }}
                                    />
                                    <details className="ctf-url-fallback" style={{ marginTop: 8 }}>
                                        <summary>Paste URL</summary>
                                        <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="Main photo URL" />
                                        <input value={Array.isArray(form.photos) ? form.photos.join(', ') : form.photos || ''} onChange={e => setForm({ ...form, photos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Gallery URLs (comma separated)" style={{ marginTop: 6 }} />
                                    </details>
                                </fieldset>

                                <fieldset style={{ marginTop: 12 }}>
                                    <legend>Highlights</legend>
                                    {(form.highlights || []).map((h, idx) => (
                                        <div key={idx} className="ctf-highlight-row">
                                            <span className="ctf-highlight-order">{h.order ?? idx + 1}</span>
                                            <div className="ctf-highlight-fields">
                                                <input value={h.title} onChange={e => updateArrayItem('highlights', idx, { ...h, title: e.target.value })} placeholder="Title *" required />
                                                <input value={h.short || ''} onChange={e => updateArrayItem('highlights', idx, { ...h, short: e.target.value })} placeholder="Short description" />
                                                <input value={h.icon || ''} onChange={e => updateArrayItem('highlights', idx, { ...h, icon: e.target.value })} placeholder="Icon name or URL" />
                                            </div>
                                            <div className="ctf-highlight-actions">
                                                <button type="button" className="btn ctf-sm-btn" disabled={idx === 0} onClick={() => {
                                                    const arr = [...(form.highlights || [])];
                                                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                                    setForm({ ...form, highlights: arr });
                                                }} title="Move up">↑</button>
                                                <button type="button" className="btn ctf-sm-btn" disabled={idx === (form.highlights || []).length - 1} onClick={() => {
                                                    const arr = [...(form.highlights || [])];
                                                    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                                                    setForm({ ...form, highlights: arr });
                                                }} title="Move down">↓</button>
                                                <button type="button" className="btn ctf-sm-btn ctf-sm-btn--danger" onClick={() => removeArrayItem('highlights', idx)} title="Remove">×</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => addArrayItem('highlights', { title: '', short: '', icon: '', order: (form.highlights || []).length + 1 })}>+ Add Highlight</button>
                                </fieldset>
                            </section>
                        )}

                        {step === 5 && (
                            <section className="ctf-section">
                                <label>Description
                                    <textarea
                                        value={form.desc}
                                        onChange={e => setForm({ ...form, desc: e.target.value })}
                                        onBlur={() => handleBlur?.('desc')}
                                        className={errClass('desc', touched, fieldErrors)}
                                        required
                                    />
                                </label>
                                {fieldErr('desc', touched, fieldErrors)}
                            </section>
                        )}

                        {step === 6 && (
                            <section className="ctf-section">
                                <label>Tags<input value={(form.tags || []).join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label>
                                <label><input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
                                <label>Status
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option value="draft">draft</option>
                                        <option value="published">published</option>
                                        <option value="cancelled">cancelled</option>
                                    </select>
                                </label>
                            </section>
                        )}
                    </form>
                </div>

                <footer className="ctf-panel-footer">
                    <div className="ctf-footer-left">
                        <button className="btn" disabled={step === 0} onClick={back}>Back</button>
                    </div>
                    <div className="ctf-footer-actions">
                        {step < STEPS.length - 1 ? (
                            <button className="btn primary" onClick={next}>Next</button>
                        ) : (
                            <button className="btn primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Submit'}</button>
                        )}
                    </div>
                </footer>
            </div>
        </aside>
    );
}
