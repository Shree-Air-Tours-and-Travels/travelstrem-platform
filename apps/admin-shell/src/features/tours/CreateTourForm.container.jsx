import React, { useState } from "react";
import { saveTour } from "../../services/adminService";
import CreateTourFormView from "./CreateTourForm.view";

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
            const payload = JSON.parse(JSON.stringify(form));

            if (typeof payload.photos === 'string') {
                payload.photos = payload.photos.split(',').map(s => s.trim()).filter(Boolean);
            }
            payload.photos = Array.isArray(payload.photos) ? payload.photos.map(String) : [];

            payload.desc = payload.desc || payload.description || '';

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

            payload.startDate = payload.startDate ? new Date(payload.startDate).toISOString() : null;
            payload.endDate = payload.endDate ? new Date(payload.endDate).toISOString() : null;

            if (payload.period) {
                payload.period.days = Number(payload.period.days || 1);
                payload.period.nights = Number(payload.period.nights || 0);
            }

            payload.inclusions = Array.isArray(payload.inclusions) ? payload.inclusions.map(String) : (payload.inclusions ? [String(payload.inclusions)] : []);
            payload.exclusions = Array.isArray(payload.exclusions) ? payload.exclusions.map(String) : (payload.exclusions ? [String(payload.exclusions)] : []);
            payload.languages = Array.isArray(payload.languages) ? payload.languages.map(String) : (payload.languages ? [String(payload.languages)] : []);
            payload.tags = Array.isArray(payload.tags) ? payload.tags.map(String) : (payload.tags ? [String(payload.tags)] : []);

            if (payload.maxGroupSize != null) payload.maxGroupSize = Number(payload.maxGroupSize);
            if (payload.minAge != null) payload.minAge = Number(payload.minAge);
            if (payload.maxAge != null) payload.maxAge = Number(payload.maxAge);

            if (!payload.title) throw new Error('Title is required.');
            if (!payload.desc) throw new Error('Description (desc) is required.');
            if (payload.price.min == null || payload.price.max == null) throw new Error('price.min and price.max are required.');

            if (typeof payload.photos === 'string') payload.photos = payload.photos.split(',').map(s => s.trim()).filter(Boolean);
            const saved = await saveTour(payload);
            onSaved(saved);
        } catch (err) {
            console.error('CreateTourForm submit error:', err);
            setError(err.message || 'Unexpected error');
        } finally {
            setSaving(false);
        }
    }

    function addArrayItem(key, item) { setForm(prev => ({ ...prev, [key]: [...(Array.isArray(prev[key]) ? prev[key] : []), item] })); }
    function updateArrayItem(key, idx, item) { setForm(prev => { const copy = { ...prev }; copy[key] = [...(copy[key] || [])]; copy[key][idx] = item; return copy; }); }
    function removeArrayItem(key, idx) { setForm(prev => { const copy = { ...prev }; copy[key] = (copy[key] || []).filter((_, i) => i !== idx); return copy; }); }

    return (
        <CreateTourFormView
            form={form}
            step={step}
            saving={saving}
            error={error}
            onCancel={onCancel}
            submit={submit}
            next={next}
            back={back}
            setForm={setForm}
            setAt={setAt}
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
        />
    );
}
