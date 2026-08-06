import React, { useState, useRef, useCallback } from "react";
import { Button, SubTitle, RecordReview } from "@packages/trem-ui";
import { getTourJsonTemplate } from "@packages/trem-utils";
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
                <Button type="button" primaryClassName="btn" onClick={add} text="Add" />
            </div>
            <div className="ctf-tag-list">
                {value.map((item, i) => (
                    <span key={i} className="ctf-tag">
                        {item}
                        <Button
                            type="button"
                            variant="text"
                            isCircular
                            iconLeft="x"
                            onClick={() => remove(i)}
                        />
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
        const selected = Array.from(files || []);
        if (selected.length > 0) onUpload(selected);
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
                        <span>Drop images here or click to browse</span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={e => { handleFile(e.target.files); e.target.value = ''; }} hidden />

            {allPhotos.length > 0 && (
                <div className="ctf-photo-grid">
                    {allPhotos.map((url, i) => (
                        <div key={i} className={`ctf-photo-thumb ${url === photo ? 'ctf-photo-thumb--main' : ''}`}>
                            <img src={url} alt={`Photo ${i + 1}`} />
                            <Button
                                type="button"
                                primaryClassName="ctf-thumb-remove"
                                variant="text"
                                isCircular
                                iconLeft="x"
                                onClick={e => { e.stopPropagation(); onRemove(url); }}
                                title="Remove"
                            />
                            {url !== photo && (
                                <Button
                                    type="button"
                                    primaryClassName="ctf-thumb-setmain"
                                    variant="text"
                                    isCircular
                                    iconLeft="star"
                                    onClick={e => { e.stopPropagation(); onSetMain(url); }}
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

export default function CreateTourFormView({
    form, step, saving, uploading, uploadProgress, importingJson, error, success, onCancel, submit, next, back,
    setForm, setAt, addArrayItem, updateArrayItem, removeArrayItem, moveArrayItem, handleUploadImage,
    touched, fieldErrors, seasonOverlaps, handleBlur, onDismissSuccess, handleImportJson,
}) {
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [jsonText, setJsonText] = useState("");
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
                        <SubTitle text={form._id ? 'Edit Tour' : 'Create Tour'} />
                        <div className="ctf-steps-line">
                            {STEPS.map((s, i) => <span key={s} className={`ctf-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>{i + 1}</span>)}
                        </div>
                    </div>
                    <div className="ctf-header-actions">
                        <Button type="button" primaryClassName="btn ctf-json-import-button" variant="outline" onClick={() => setShowJsonImport((value) => !value)} disabled={importingJson} text={showJsonImport ? "Hide JSON" : "Paste JSON"} />
                        <Button primaryClassName="btn" onClick={onCancel} text="Cancel" />
                    </div>
                </header>

                <div className="ctf-panel-body">
                    <form onSubmit={submit} className="ctf-form-inner">
                        {error && <div className="ctf-feedback ctf-feedback--error">{error}</div>}
                        {success && <div className="ctf-feedback ctf-feedback--ok">{success}</div>}

                        {showJsonImport && (
                            <section className="ctf-json-import">
                                <div className="ctf-json-import__heading"><div><strong>Paste complete tour JSON</strong><span>All supported schema fields will be added to the form. Review them before submitting.</span></div><Button type="button" primaryClassName="btn" variant="text" onClick={() => setJsonText("")} disabled={!jsonText} text="Clear" /></div>
                                <textarea className="ctf-json-import__editor" value={jsonText} onChange={(event) => setJsonText(event.target.value)} placeholder={'{\n  "title": "Himalayan Escape",\n  "city": { "from": "Delhi", "to": "Manali" },\n  "price": { "min": 24999, "max": 29999 },\n  ...\n}'} spellCheck={false} aria-label="Tour JSON object" />
                                <div className="ctf-json-import__actions"><span>Use a valid role-safe template for an AI or manual completion.</span><Button type="button" primaryClassName="btn" variant="outline" onClick={() => setJsonText(getTourJsonTemplate({ master: true }))} text="Get valid JSON object" /><Button type="button" primaryClassName="btn" variant="solid" color="primary" disabled={importingJson || !jsonText.trim()} onClick={() => { if (handleImportJson(jsonText)) { setShowJsonImport(false); setJsonText(""); } }} text={importingJson ? "Importing..." : "Apply JSON"} /></div>
                            </section>
                        )}

                        {step === 0 && (
                            <section className="ctf-section">
                                <div className="ctf-json-import-note"><strong>Have a complete tour JSON?</strong><span>Use Paste JSON above to fill all supported fields, then review each step before submitting.</span></div>
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
                                <SubTitle text="Itinerary Days" />
                                {(form.itinerary || []).map((day, idx) => (
                                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <strong>Day {day.day || idx + 1}</strong>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <Button type="button" primaryClassName="btn" disabled={idx === 0} onClick={() => moveArrayItem?.('itinerary', idx, idx - 1)} text="▲" />
                                                <Button type="button" primaryClassName="btn" disabled={idx === (form.itinerary || []).length - 1} onClick={() => moveArrayItem?.('itinerary', idx, idx + 1)} text="▼" />
                                                <Button type="button" primaryClassName="btn" onClick={() => removeArrayItem('itinerary', idx)} text="Remove" />
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
                                <Button type="button" primaryClassName="btn" onClick={() => {
                                    const nextDay = ((form.itinerary || []).reduce((max, d) => Math.max(max, d.day || 0), 0)) + 1;
                                    addArrayItem('itinerary', { day: nextDay, title: '', summary: '', activities: [], meals: [], accommodation: '', location: '', notes: '' });
                                }} text="+ Add Day" />
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
                                <div className="ctf-row"><label>Currency<input value={form.price.currency || 'INR'} onChange={e => setAt('price.currency', e.target.value.toUpperCase())} /></label><label>Price source<input value={form.price.source || 'manual'} onChange={e => setAt('price.source', e.target.value)} /></label></div>
                                <label><input type="checkbox" checked={!!form.price.isFinal} onChange={e => setAt('price.isFinal', e.target.checked)} /> Final price (not an estimate)</label>
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
                                                <input type="number" min={0} value={s.min ?? form.price.min} placeholder="Min" onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, min: Number(e.target.value) })} />
                                                <input type="number" min={0} value={s.max ?? form.price.max} placeholder="Max" onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, max: Number(e.target.value) })} />
                                                <Button type="button" primaryClassName="btn" onClick={() => removeArrayItem('seasonalPricing', idx)} text="Remove" />
                                            </div>
                                        );
                                    })}
                                    <Button type="button" primaryClassName="btn" onClick={() => addArrayItem('seasonalPricing', { seasonName: '', startDate: '', endDate: '', min: form.price.min, max: form.price.max })} text="Add season" />
                                </fieldset>
                            </section>
                        )}

                        {step === 4 && (
                            <section className="ctf-section">
                                <fieldset><legend>Booking & logistics</legend>
                                    <div className="ctf-row"><label>Meeting point<input value={form.meetingPoint || ''} onChange={e => setForm({ ...form, meetingPoint: e.target.value })} /></label><label>Maximum group size<input type="number" min={1} value={form.maxGroupSize} onChange={e => setForm({ ...form, maxGroupSize: Number(e.target.value) })} /></label></div>
                                    <div className="ctf-row"><label>Total seats<input type="number" min={0} value={form.availability?.totalSeats ?? ''} onChange={e => setAt('availability.totalSeats', e.target.value === '' ? null : Number(e.target.value))} /></label><label>Seats available<input type="number" min={0} value={form.availability?.seatsAvailable ?? ''} onChange={e => setAt('availability.seatsAvailable', e.target.value === '' ? null : Number(e.target.value))} /></label></div>
                                    <div className="ctf-row"><label>Minimum age<input type="number" min={0} value={form.minAge ?? ''} onChange={e => setForm({ ...form, minAge: e.target.value === '' ? null : Number(e.target.value) })} /></label><label>Maximum age<input type="number" min={0} value={form.maxAge ?? ''} onChange={e => setForm({ ...form, maxAge: e.target.value === '' ? null : Number(e.target.value) })} /></label></div>
                                    <label>Languages<ChipInput value={form.languages || []} onChange={v => setForm({ ...form, languages: v })} placeholder="Add language" /></label>
                                    <label>Inclusions<ChipInput value={form.inclusions || []} onChange={v => setForm({ ...form, inclusions: v })} placeholder="Add inclusion" /></label>
                                    <label>Exclusions<ChipInput value={form.exclusions || []} onChange={v => setForm({ ...form, exclusions: v })} placeholder="Add exclusion" /></label>
                                </fieldset>
                                <fieldset><legend>Cancellation policy</legend>
                                    <label>Policy<textarea value={form.cancellationPolicy || ''} onChange={e => setForm({ ...form, cancellationPolicy: e.target.value })} /></label>
                                    <div className="ctf-row"><label>Free cancellation until<input value={form.cancellation?.freeCancellationUntil || ''} onChange={e => setAt('cancellation.freeCancellationUntil', e.target.value)} /></label><label>Refund percent<input type="number" min={0} max={100} value={form.cancellation?.refundPercent ?? 100} onChange={e => setAt('cancellation.refundPercent', Number(e.target.value))} /></label></div>
                                    <label><input type="checkbox" checked={!!form.cancellation?.depositRequired} onChange={e => setAt('cancellation.depositRequired', e.target.checked)} /> Deposit required</label>
                                    {form.cancellation?.depositRequired && <div className="ctf-row"><label>Deposit percent<input type="number" min={0} max={100} value={form.cancellation?.depositPercent ?? ''} onChange={e => setAt('cancellation.depositPercent', e.target.value === '' ? null : Number(e.target.value))} /></label><label>Deposit note<input value={form.cancellation?.depositNote || ''} onChange={e => setAt('cancellation.depositNote', e.target.value)} /></label></div>}
                                    <label>Cancellation note<textarea value={form.cancellation?.note || ''} onChange={e => setAt('cancellation.note', e.target.value)} /></label>
                                </fieldset>
                                <fieldset><legend>Optional extras</legend>
                                    {(form.extras || []).map((extra, idx) => <div className="ctf-array" key={idx}><input value={extra.title || ''} placeholder="Title" onChange={e => updateArrayItem('extras', idx, { ...extra, title: e.target.value })} /><input value={extra.description || ''} placeholder="Description" onChange={e => updateArrayItem('extras', idx, { ...extra, description: e.target.value })} /><input type="number" min={0} value={extra.price ?? 0} placeholder="Price" onChange={e => updateArrayItem('extras', idx, { ...extra, price: Number(e.target.value) })} /><input value={extra.currency || 'INR'} placeholder="Currency" onChange={e => updateArrayItem('extras', idx, { ...extra, currency: e.target.value })} /><input value={extra.priceLabel || ''} placeholder="e.g. Per person" onChange={e => updateArrayItem('extras', idx, { ...extra, priceLabel: e.target.value })} /><label><input type="checkbox" checked={!!extra.included} onChange={e => updateArrayItem('extras', idx, { ...extra, included: e.target.checked })} /> Included</label><Button type="button" primaryClassName="btn" onClick={() => removeArrayItem('extras', idx)} text="Remove" /></div>)}
                                    <Button type="button" primaryClassName="btn" onClick={() => addArrayItem('extras', { title: '', description: '', price: 0, currency: 'INR', priceLabel: '', icon: '', included: false })} text="Add extra" />
                                </fieldset>
                                <fieldset><legend>Included stays</legend>{(form.includedStays || []).map((stay, idx) => <div className="ctf-array" key={idx}><input type="number" min={0} value={stay.nights ?? 1} placeholder="Nights" onChange={e => updateArrayItem('includedStays', idx, { ...stay, nights: Number(e.target.value) })} /><input value={stay.location || ''} placeholder="Location" onChange={e => updateArrayItem('includedStays', idx, { ...stay, location: e.target.value })} /><input value={stay.propertyName || ''} placeholder="Property name" onChange={e => updateArrayItem('includedStays', idx, { ...stay, propertyName: e.target.value })} /><input value={stay.propertyClass || ''} placeholder="Property class" onChange={e => updateArrayItem('includedStays', idx, { ...stay, propertyClass: e.target.value })} /><input value={stay.roomType || ''} placeholder="Room type" onChange={e => updateArrayItem('includedStays', idx, { ...stay, roomType: e.target.value })} /><Button type="button" primaryClassName="btn" onClick={() => removeArrayItem('includedStays', idx)} text="Remove" /></div>)}<Button type="button" primaryClassName="btn" onClick={() => addArrayItem('includedStays', { nights: 1, location: '', propertyName: '', propertyClass: '', roomType: '', meals: [], description: '' })} text="Add stay" /></fieldset>
                                <fieldset><legend>Hotel upgrades</legend>{(form.hotelOptions || []).map((hotel, idx) => <div className="ctf-array" key={idx}><input value={hotel.title || ''} placeholder="Title" onChange={e => updateArrayItem('hotelOptions', idx, { ...hotel, title: e.target.value })} /><input value={hotel.description || ''} placeholder="Description" onChange={e => updateArrayItem('hotelOptions', idx, { ...hotel, description: e.target.value })} /><input value={hotel.costLabel || ''} placeholder="Cost label" onChange={e => updateArrayItem('hotelOptions', idx, { ...hotel, costLabel: e.target.value })} /><input value={hotel.cost || ''} placeholder="Cost" onChange={e => updateArrayItem('hotelOptions', idx, { ...hotel, cost: e.target.value })} /><label><input type="checkbox" checked={!!hotel.recommended} onChange={e => updateArrayItem('hotelOptions', idx, { ...hotel, recommended: e.target.checked })} /> Recommended</label><Button type="button" primaryClassName="btn" onClick={() => removeArrayItem('hotelOptions', idx)} text="Remove" /></div>)}<Button type="button" primaryClassName="btn" onClick={() => addArrayItem('hotelOptions', { title: '', description: '', costLabel: 'Upgrade cost', cost: '', recommended: false })} text="Add hotel upgrade" /></fieldset>
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
                                                <Button type="button" primaryClassName="btn ctf-sm-btn" disabled={idx === 0} onClick={() => {
                                                    const arr = [...(form.highlights || [])];
                                                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                                    setForm({ ...form, highlights: arr });
                                                }} title="Move up" text="↑" />
                                                <Button type="button" primaryClassName="btn ctf-sm-btn" disabled={idx === (form.highlights || []).length - 1} onClick={() => {
                                                    const arr = [...(form.highlights || [])];
                                                    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                                                    setForm({ ...form, highlights: arr });
                                                }} title="Move down" text="↓" />
                                                <Button type="button" primaryClassName="btn ctf-sm-btn ctf-sm-btn--danger" variant="text" isCircular iconLeft="x" onClick={() => removeArrayItem('highlights', idx)} title="Remove" />
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" primaryClassName="btn" style={{ marginTop: 8 }} onClick={() => addArrayItem('highlights', { title: '', short: '', icon: '', order: (form.highlights || []).length + 1 })} text="+ Add Highlight" />
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

                        {step === 6 && (
                            <section className="ctf-section">
                                <SubTitle text="Review & Submit" />
                                <RecordReview data={form} title="Complete tour preview" description="Check every tour value below. Use Back to make changes before submitting." />
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
                            <Button primaryClassName="btn" variant="solid" color="primary" type="submit" onClick={submit} disabled={saving} text={saving ? 'Saving…' : 'Submit'} />
                        )}
                    </div>
                </footer>
            </div>
        </aside>
    );
}
