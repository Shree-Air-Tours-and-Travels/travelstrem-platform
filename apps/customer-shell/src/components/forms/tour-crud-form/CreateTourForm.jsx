// src/forms/CreateTourForm.jsx
import React, { useMemo, useState } from 'react';
import './createTourForm.scss';
import fetchData from '../../../utils/fetchData';

const STEPS = ['Basic', 'Schedule', 'Pricing', 'Logistics', 'Content', 'Review'];

export default function CreateTourForm({ initial = null, onCancel = () => { }, onSaved = () => { } }) {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(() => {
        const blank = {
            title: '',
            city: { from: '', to: '' },
            address: { line1: '', line2: '', city: '', state: '', zip: '', country: '' },
            distance: 0,
            period: { days: 1, nights: 0 },
            startDate: null,
            endDate: null,
            photo: '',
            photos: [],
            desc: '',
            price: { min: 0, max: 0, currency: 'INR', isFinal: false, source: 'manual' },
            seasonalPricing: [],
            itinerary: [],
            highlights: [],
            availability: { totalSeats: null, seatsAvailable: null },
            meetingPoint: '',
            inclusions: [],
            exclusions: [],
            languages: [],
            cancellationPolicy: '',
            minAge: null,
            maxAge: null,
            maxGroupSize: 1,
            reviews: [],
            featured: false,
            tags: [],
            isPublished: true,
            status: 'published',
        };
        return initial ? { ...blank, ...initial } : blank;
    });

    function setAt(path, value) {
        setForm(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            const parts = path.split('.'); let cur = copy;
            for (let i = 0; i < parts.length - 1; i++) { if (!cur[parts[i]]) cur[parts[i]] = {}; cur = cur[parts[i]]; }
            cur[parts[parts.length - 1]] = value;
            return copy;
        });
    }

    function next() { setStep(s => Math.min(STEPS.length - 1, s + 1)); }
    function back() { setStep(s => Math.max(0, s - 1)); }

    async function submit(e) {
        e?.preventDefault?.();
        setSaving(true);
        setError(null);

        try {
            // Deep copy so we don't accidentally mutate state
            const payload = JSON.parse(JSON.stringify(form));

            // Photos: accept comma-separated string or array
            if (typeof payload.photos === 'string') {
                payload.photos = payload.photos.split(',').map(s => s.trim()).filter(Boolean);
            }
            payload.photos = Array.isArray(payload.photos) ? payload.photos.map(String) : [];

            // Ensure desc exists (controller requires desc/description)
            payload.desc = payload.desc || payload.description || '';

            // Normalize price object (controller expects numbers + currency)
            payload.price = payload.price || {};
            payload.price.min = Number(payload.price.min || 0);
            payload.price.max = Number(payload.price.max || 0);
            payload.price.currency = payload.price.currency || 'INR';
            payload.price.isFinal = !!payload.price.isFinal;
            payload.price.source = payload.price.source || 'manual';

            if (Number.isNaN(payload.price.min) || Number.isNaN(payload.price.max)) {
                throw new Error('Min and Max price must be valid numbers.');
            }
            if (payload.price.min > payload.price.max) {
                throw new Error('price.min cannot be greater than price.max');
            }

            // Seasonal pricing: ensure min/max numbers and date strings (ISO) or null
            payload.seasonalPricing = (payload.seasonalPricing || []).map((s, idx) => {
                const startDate = s.startDate ? new Date(s.startDate) : null;
                const endDate = s.endDate ? new Date(s.endDate) : null;
                return {
                    seasonName: s.seasonName || `Season ${idx + 1}`,
                    startDate: startDate && !isNaN(startDate) ? startDate.toISOString() : null,
                    endDate: endDate && !isNaN(endDate) ? endDate.toISOString() : null,
                    min: Number(s.min != null ? s.min : payload.price.min),
                    max: Number(s.max != null ? s.max : payload.price.max),
                    currency: s.currency || payload.price.currency || 'INR',
                    isFinal: !!s.isFinal,
                    source: s.source || 'manual',
                    notes: s.notes || '',
                };
            });

            // Dates: convert to ISO or null so controller.parseDate can parse them
            payload.startDate = payload.startDate ? new Date(payload.startDate).toISOString() : null;
            payload.endDate = payload.endDate ? new Date(payload.endDate).toISOString() : null;

            // Period numbers safety
            if (payload.period) {
                payload.period.days = Number(payload.period.days || 1);
                payload.period.nights = Number(payload.period.nights || 0);
            }

            // Arrays: ensure arrays of strings where appropriate
            payload.inclusions = Array.isArray(payload.inclusions) ? payload.inclusions.map(String) : (payload.inclusions ? [String(payload.inclusions)] : []);
            payload.exclusions = Array.isArray(payload.exclusions) ? payload.exclusions.map(String) : (payload.exclusions ? [String(payload.exclusions)] : []);
            payload.languages = Array.isArray(payload.languages) ? payload.languages.map(String) : (payload.languages ? [String(payload.languages)] : []);
            payload.tags = Array.isArray(payload.tags) ? payload.tags.map(String) : (payload.tags ? [String(payload.tags)] : []);

            // Simple numeric enforcement
            if (payload.maxGroupSize != null) payload.maxGroupSize = Number(payload.maxGroupSize);
            if (payload.minAge != null) payload.minAge = Number(payload.minAge);
            if (payload.maxAge != null) payload.maxAge = Number(payload.maxAge);

            // Basic required field checks before sending (controller will still validate)
            if (!payload.title) throw new Error('Title is required.');
            if (!payload.desc) throw new Error('Description (desc) is required.');
            if (payload.price.min == null || payload.price.max == null) throw new Error('price.min and price.max are required.');

            const method = payload._id ? 'PUT' : 'POST';
            const url = payload._id  ? `/tours.json/${payload._id }` : `/tours.json`;

            if (typeof payload.photos === 'string') payload.photos = payload.photos.split(',').map(s => s.trim()).filter(Boolean);

            const res = await fetchData(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.status === 'success') {
                const saved = res.componentData?.state?.data?.tours?.[0] || null;
                onSaved(saved || res);
            } else {
                // backend returned an error-like response
                throw new Error(res.message || 'Failed to save tour');
            }
        } catch (err) {
            console.error('CreateTourForm submit error:', err);
            setError(err.message || 'Unexpected error');
        } finally {
            setSaving(false);
        }
    }

    // simple add/remove helpers (same as before)
    function addArrayItem(key, item) { setForm(prev => ({ ...prev, [key]: [...(Array.isArray(prev[key]) ? prev[key] : []), item] })); }
    function updateArrayItem(key, idx, item) { setForm(prev => { const copy = { ...prev }; copy[key] = [...(copy[key] || [])]; copy[key][idx] = item; return copy; }); }
    function removeArrayItem(key, idx) { setForm(prev => { const copy = { ...prev }; copy[key] = (copy[key] || []).filter((_, i) => i !== idx); return copy; }); }

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
