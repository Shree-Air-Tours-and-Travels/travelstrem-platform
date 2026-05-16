import React from "react";
import "./CreateTourForm.scss";

const STEPS = ['Basic', 'Schedule', 'Pricing', 'Logistics', 'Content', 'Review'];

export default function CreateTourFormView({
    form, step, saving, error, onCancel, submit, next, back,
    setForm, setAt, addArrayItem, updateArrayItem, removeArrayItem
}) {
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
                        {error && <div className="ctf-error">Error: {error}</div>}

                        {step === 0 && (
                            <section className="ctf-section">
                                <label>Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
                                <div className="ctf-row">
                                    <label>From<input value={form.city.from} onChange={e => setAt('city.from', e.target.value)} /></label>
                                    <label>To<input value={form.city.to} onChange={e => setAt('city.to', e.target.value)} /></label>
                                </div>
                                <fieldset>
                                    <legend>Address</legend>
                                    <label>Line1<input value={form.address.line1} onChange={e => setAt('address.line1', e.target.value)} /></label>
                                    <label>Line2<input value={form.address.line2} onChange={e => setAt('address.line2', e.target.value)} /></label>
                                </fieldset>
                            </section>
                        )}

                        {step === 1 && (
                            <section className="ctf-section">
                                <div className="ctf-row">
                                    <label>Start Date<input type="date" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value || null })} /></label>
                                    <label>End Date<input type="date" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value || null })} /></label>
                                </div>
                                <div className="ctf-row">
                                    <label>Days<input type="number" min={1} value={form.period.days} onChange={e => setAt('period.days', Number(e.target.value))} /></label>
                                    <label>Nights<input type="number" min={0} value={form.period.nights} onChange={e => setAt('period.nights', Number(e.target.value))} /></label>
                                </div>
                            </section>
                        )}

                        {step === 2 && (
                            <section className="ctf-section">
                                <div className="ctf-row">
                                    <label>Min price<input type="number" value={form.price.min} onChange={e => setAt('price.min', Number(e.target.value))} /></label>
                                    <label>Max price<input type="number" value={form.price.max} onChange={e => setAt('price.max', Number(e.target.value))} /></label>
                                </div>
                                <fieldset>
                                    <legend>Seasonal Pricing</legend>
                                    {(form.seasonalPricing || []).map((s, idx) => (
                                        <div key={idx} className="ctf-array">
                                            <input value={s.seasonName || ''} placeholder="name" onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, seasonName: e.target.value })} />
                                            <input type="date" value={s.startDate || ''} onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, startDate: e.target.value })} />
                                            <input type="date" value={s.endDate || ''} onChange={e => updateArrayItem('seasonalPricing', idx, { ...s, endDate: e.target.value })} />
                                            <button type="button" className="btn" onClick={() => removeArrayItem('seasonalPricing', idx)}>Remove</button>
                                        </div>
                                    ))}
                                    <button type="button" className="btn" onClick={() => addArrayItem('seasonalPricing', { seasonName: '', startDate: '', endDate: '', min: form.price.min, max: form.price.max })}>Add season</button>
                                </fieldset>
                            </section>
                        )}

                        {step === 3 && (
                            <section className="ctf-section">
                                <label>Meeting point<input value={form.meetingPoint} onChange={e => setForm({ ...form, meetingPoint: e.target.value })} /></label>
                                <div className="ctf-row">
                                    <label>Languages<input value={(form.languages || []).join(', ')} onChange={e => setForm({ ...form, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label>
                                    <label>Max group<input type="number" value={form.maxGroupSize} onChange={e => setForm({ ...form, maxGroupSize: Number(e.target.value) })} /></label>
                                </div>
                            </section>
                        )}

                        {step === 4 && (
                            <section className="ctf-section">
                                <label>Description<textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} /></label>
                                <label>Main photo URL<input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} /></label>
                                <label>Photos (comma separated)<input value={Array.isArray(form.photos) ? form.photos.join(', ') : form.photos || ''} onChange={e => setForm({ ...form, photos: e.target.value })} /></label>
                            </section>
                        )}

                        {step === 5 && (
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
