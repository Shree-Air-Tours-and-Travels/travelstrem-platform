import React, { useState, useEffect } from "react";
import { saveTour, uploadTourImage } from "../../services/adminService";
import { validateFields } from "@packages/trem-utils";
import CreateTourFormView from "./CreateTourForm.view";

const STEPS = ['Basic', 'Schedule', 'Itinerary', 'Pricing', 'Logistics', 'Content', 'Review'];

const REQUIRED_FIELDS = ['title', 'city.from', 'city.to', 'distance', 'period.days', 'period.nights', 'desc', 'maxGroupSize', 'price.min', 'price.max'];

function getFieldValue(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = cur[p];
    }
    return cur;
}

export default function CreateTourForm({ initial = null, onCancel = () => { }, onSaved = () => { } }) {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [seasonOverlaps, setSeasonOverlaps] = useState([]);
    const [form, setFormState] = useState(() => {
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

    function setForm(valueOrFn) {
        setDirty(true);
        setFormState(valueOrFn);
    }

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

    function findSeasonalOverlaps(pricing) {
        const indexed = (pricing || []).map((s, idx) => ({ ...s, idx, _start: s.startDate ? new Date(s.startDate) : null, _end: s.endDate ? new Date(s.endDate) : null }));
        const withDates = indexed.filter(s => s._start && s._end && !isNaN(s._start) && !isNaN(s._end));
        if (withDates.length < 2) return [];
        const sorted = [...withDates].sort((a, b) => a._start - b._start);
        const overlaps = [];
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            if (curr._start <= prev._end) {
                overlaps.push({ idxA: prev.idx, idxB: curr.idx, msg: `"${curr.seasonName || 'Season'}" overlaps with "${prev.seasonName || 'Season'}"` });
            }
        }
        return overlaps;
    }

    function validateAll() {
        const errs = {};

        const flat = {
            title: form.title,
            desc: form.desc,
        };
        const fieldMap = {
            title: { type: "text", required: true, messages: { required: "Title is required" } },
            desc: { type: "textarea", required: true, messages: { required: "Description is required" } },
        };
        const result = validateFields(flat, fieldMap);
        Object.assign(errs, result.errors);

        if (!form.city?.from) errs['city.from'] = 'City from is required';
        if (!form.city?.to) errs['city.to'] = 'City to is required';
        if (form.distance == null || Number(form.distance) < 0) errs.distance = 'Distance must be 0 or more';
        if (form.period?.days == null || Number(form.period.days) < 1) errs['period.days'] = 'Days must be at least 1';
        if (form.period?.nights == null || Number(form.period.nights) < 0) errs['period.nights'] = 'Nights must be 0 or more';
        if (form.price?.min == null || Number(form.price.min) < 0) errs['price.min'] = 'Min price is required';
        if (form.price?.max == null || Number(form.price.max) < 0) errs['price.max'] = 'Max price is required';
        if (Number(form.price?.min) > Number(form.price?.max)) errs['price.max'] = 'Max must be >= min';
        if (form.maxGroupSize == null || Number(form.maxGroupSize) < 1) errs.maxGroupSize = 'Max group size must be at least 1';
        return errs;
    }

    function handleBlur(name) {
        setTouched(prev => ({ ...prev, [name]: true }));
        const errs = validateAll();
        setFieldErrors(prev => ({ ...prev, [name]: errs[name] || null }));
    }

    function markAllTouched() {
        const all = {};
        REQUIRED_FIELDS.forEach(f => { all[f] = true; });
        setTouched(all);
        setFieldErrors(validateAll());
    }

    async function submit(e) {
        e?.preventDefault?.();
        setError(null);
        setSuccess(null);

        const errs = validateAll();
        if (Object.keys(errs).length > 0) {
            markAllTouched();
            setError(Object.values(errs)[0]);
            return;
        }

        setSaving(true);

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
            if (payload.distance != null) payload.distance = Number(payload.distance);

            if (payload.availability) {
                payload.availability.totalSeats = payload.availability.totalSeats != null ? Number(payload.availability.totalSeats) : null;
                payload.availability.seatsAvailable = payload.availability.seatsAvailable != null ? Number(payload.availability.seatsAvailable) : null;
            }

            if (typeof payload.photos === 'string') payload.photos = payload.photos.split(',').map(s => s.trim()).filter(Boolean);

            const overlaps = findSeasonalOverlaps(payload.seasonalPricing);
            if (overlaps.length > 0) {
                setSeasonOverlaps(overlaps);
                throw new Error(overlaps[0].msg);
            }

            const days = payload.itinerary?.map(d => d.day).filter(d => d != null) || [];
            if (days.length > 0) {
                const unique = new Set(days);
                if (unique.size !== days.length) throw new Error('Itinerary day numbers must be unique.');
                const sorted = [...days].sort((a, b) => a - b);
                if (sorted[sorted.length - 1] !== sorted.length) throw new Error('Itinerary day numbers must be sequential (1, 2, 3, …).');
            }

            const saved = await saveTour(payload);
            setDirty(false);
            setSuccess(form._id ? 'Tour updated successfully!' : 'Tour created successfully!');
            setTimeout(() => onSaved(saved), 2000);
        } catch (err) {
            console.error('CreateTourForm submit error:', err);
            setError(err.message || 'Unexpected error');
        } finally {
            setSaving(false);
        }
    }

    function addArrayItem(key, item) { setDirty(true); setFormState(prev => ({ ...prev, [key]: [...(Array.isArray(prev[key]) ? prev[key] : []), item] })); }
    function updateArrayItem(key, idx, item) { setDirty(true); setFormState(prev => { const copy = { ...prev }; copy[key] = [...(copy[key] || [])]; copy[key][idx] = item; return copy; }); }
    function removeArrayItem(key, idx) { setDirty(true); setFormState(prev => { const copy = { ...prev }; copy[key] = (copy[key] || []).filter((_, i) => i !== idx); return copy; }); }
    function moveArrayItem(key, fromIdx, toIdx) { setDirty(true); setFormState(prev => { const copy = { ...prev }; const arr = [...(copy[key] || [])]; if (toIdx < 0 || toIdx >= arr.length) return prev; const [moved] = arr.splice(fromIdx, 1); arr.splice(toIdx, 0, moved); copy[key] = arr; return copy; }); }

    async function handleUploadImage(fileOrFiles) {
        const files = Array.isArray(fileOrFiles)
            ? fileOrFiles
            : Array.from(fileOrFiles?.length != null ? fileOrFiles : (fileOrFiles ? [fileOrFiles] : []));
        if (files.length === 0) return null;

        setUploading(true);
        setUploadProgress(0);
        try {
            const urls = [];
            for (let i = 0; i < files.length; i += 1) {
                const url = await uploadTourImage(files[i]);
                urls.push(url);
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
            setForm(prev => {
                const existing = Array.isArray(prev.photos) ? prev.photos : [];
                const photos = [...existing, ...urls].filter(Boolean);
                return { ...prev, photo: prev.photo || urls[0] || '', photos };
            });
            return urls.length === 1 ? urls[0] : urls;
        } catch (e) {
            console.error("Upload failed:", e);
            setError(e.message || "Upload failed");
            return null;
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }

    function handleCancel() {
        if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;
        onCancel();
    }

    useEffect(() => {
        setSeasonOverlaps(findSeasonalOverlaps(form.seasonalPricing));
    }, [form.seasonalPricing]);

    useEffect(() => {
        if (!dirty) return;
        function handler(e) {
            e.preventDefault();
            e.returnValue = '';
        }
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    return (
        <CreateTourFormView
            form={form}
            step={step}
            saving={saving}
            uploading={uploading}
            uploadProgress={uploadProgress}
            error={error}
            success={success}
            touched={touched}
            fieldErrors={fieldErrors}
            seasonOverlaps={seasonOverlaps}
            onCancel={handleCancel}
            submit={submit}
            next={next}
            back={back}
            setForm={setForm}
            setAt={setAt}
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
            moveArrayItem={moveArrayItem}
            handleUploadImage={handleUploadImage}
            handleBlur={handleBlur}
            onDismissSuccess={() => setSuccess(null)}
        />
    );
}
