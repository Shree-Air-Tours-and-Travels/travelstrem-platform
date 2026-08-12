import React, { useState, useEffect, useRef } from "react";
import { saveAgentTour, uploadTourImage } from "../../../services/agentService";
import { validateFields } from "@packages/trem-utils";
import { FORM_STEPS, REQUIRED_TOUR_FIELDS, DEFAULT_CURRENCY } from "./tours.constants";
import pageConfig from "./createTourForm.config.json";
import CreateTourFormView from "./CreateTourForm.view";

function unwrapTourJson(value) {
    if (!value || Array.isArray(value) || typeof value !== "object") return null;
    for (const key of ["tour", "data", "result", "payload", "componentData", "component"]) {
        const candidate = value[key];
        if (Array.isArray(candidate) && candidate.length === 1) return unwrapTourJson(candidate[0]);
        if (candidate && !Array.isArray(candidate) && typeof candidate === "object") return unwrapTourJson(candidate);
    }
    return value;
}

// Native date inputs only accept YYYY-MM-DD. API records and AI-generated JSON
// commonly use ISO timestamps, which otherwise render as an empty date field.
function toDateInputValue(value) {
    if (value == null || value === '') return null;
    const raw = String(value).trim();
    const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
    if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

    // Accept the common India-facing DD/MM/YYYY (or DD-MM-YYYY) format too.
    const dayFirstDate = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dayFirstDate) {
        const [, day, month, year] = dayFirstDate;
        const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
        if (parsed.getUTCFullYear() === Number(year) && parsed.getUTCMonth() === Number(month) - 1 && parsed.getUTCDate() === Number(day)) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function normalizeSeasonalPricing(seasonalPricing) {
    if (!Array.isArray(seasonalPricing)) return [];
    return seasonalPricing.map((season) => ({
        ...season,
        startDate: toDateInputValue(season?.startDate),
        endDate: toDateInputValue(season?.endDate),
    }));
}

function cleanImportedTour(imported, current, initial) {
    const price = typeof imported.price === "number"
        ? { min: imported.price, max: imported.price }
        : (imported.price || imported.priceInfo || {});
    const next = {
        ...current,
        ...imported,
        city: { ...current.city, ...(imported.city || {}) },
        address: { ...current.address, ...(imported.address || {}) },
        period: { ...current.period, ...(imported.period || {}) },
        price: { ...current.price, ...price },
        availability: { ...current.availability, ...(imported.availability || {}) },
        desc: imported.desc ?? imported.description ?? current.desc,
        photo: imported.photo || imported.image || current.photo,
        photos: Array.isArray(imported.photos) ? imported.photos : current.photos,
        startDate: imported.startDate != null ? toDateInputValue(imported.startDate) : current.startDate,
        endDate: imported.endDate != null ? toDateInputValue(imported.endDate) : current.endDate,
        seasonalPricing: Array.isArray(imported.seasonalPricing) ? normalizeSeasonalPricing(imported.seasonalPricing) : current.seasonalPricing,
    };
    if (!initial?._id) ["_id", "id", "__v", "createdAt", "updatedAt", "agencyId", "ownerAgent", "createdBy"].forEach((key) => delete next[key]);
    else next._id = initial._id;
    return next;
}

let tourFormKeyCounter = 0;
function genKey() { return `_k_${++tourFormKeyCounter}_${Date.now()}`; }
function ensureKeys(arr) {
    return (arr || []).map(item => item && typeof item === 'object' && !item._key
        ? { ...item, _key: genKey() }
        : item);
}

export default function CreateTourForm({ initial = null, onCancel = () => { }, onSaved = () => { }, variant = 'modal' }) {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [importingJson, setImportingJson] = useState(false);
    const [dirty, setDirty] = useState(false);
    const successTimerRef = useRef(null);
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
            price: { min: 0, max: 0, currency: DEFAULT_CURRENCY, isFinal: false, source: 'manual' },
            seasonalPricing: [],
            itinerary: [],
            highlights: [],
            includedStays: [],
            hotelOptions: [],
            cancellation: { policy: '', freeCancellationUntil: '', refundPercent: 100, depositRequired: false, depositPercent: null, depositNote: '', note: '', tiers: [] },
            extras: [],
            availability: { totalSeats: null, seatsAvailable: null },
            flights: { included: false, inventoryManaged: false },
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
        const merged = initial ? { ...blank, ...initial } : blank;
        merged.startDate = toDateInputValue(merged.startDate);
        merged.endDate = toDateInputValue(merged.endDate);
        merged.seasonalPricing = normalizeSeasonalPricing(merged.seasonalPricing);
        merged.itinerary = ensureKeys(merged.itinerary);
        merged.seasonalPricing = ensureKeys(merged.seasonalPricing);
        merged.highlights = ensureKeys(merged.highlights);
        return merged;
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

    function handleImportJson(jsonText) {
        if (!String(jsonText || "").trim()) { setError("Paste a tour JSON object before importing."); return false; }
        setError(null); setSuccess(null); setImportingJson(true);
        try {
            const imported = unwrapTourJson(JSON.parse(jsonText));
            if (!imported || !imported.title) throw new Error("This does not look like a tour JSON object. A title is required.");
            setFormState((current) => cleanImportedTour(imported, current, initial));
            setDirty(true); setStep(0); setSuccess("JSON imported. Review every step before submitting.");
            return true;
        } catch (importError) {
            setError(importError instanceof SyntaxError ? "The pasted content is not valid JSON. Check commas, quotes, and brackets." : (importError.message || "Could not import this tour JSON."));
            return false;
        } finally { setImportingJson(false); }
    }

    function next() { setStep(s => Math.min(FORM_STEPS.length - 1, s + 1)); }
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

        if (form.minAge != null && form.maxAge != null && Number(form.minAge) > Number(form.maxAge)) {
            errs.minAge = 'Min age must be <= max age';
        }
        if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
            errs.startDate = 'Start date must be before end date';
        }
        if (form.flights?.included && form.flights?.inventoryManaged && form.availability?.totalSeats != null && form.availability?.seatsAvailable != null
            && Number(form.availability.seatsAvailable) > Number(form.availability.totalSeats)) {
            errs['availability.seatsAvailable'] = 'Available seats cannot exceed total seats';
        }
        if (form.title && form.title.length > 200) {
            errs.title = 'Title must be 200 characters or less';
        }
        if (form.desc && form.desc.length > 5000) {
            errs.desc = 'Description must be 5000 characters or less';
        }

        return errs;
    }

    function handleBlur(name) {
        setTouched(prev => ({ ...prev, [name]: true }));
        const errs = validateAll();
        setFieldErrors(prev => ({ ...prev, [name]: errs[name] || null }));
    }

    function markAllTouched() {
        const all = {};
        REQUIRED_TOUR_FIELDS.forEach(f => { all[f] = true; });
        setTouched(all);
        setFieldErrors(validateAll());
    }

    async function submit(e) {
        e?.preventDefault?.();
        setError(null);
        setSuccess(null);

        const errs = validateAll();
        const errList = Object.values(errs);
        if (errList.length > 0) {
            markAllTouched();
            setError(errList.join('. ') + '.');
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
            payload.price.currency = payload.price.currency || DEFAULT_CURRENCY;
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
                    currency: s.currency || payload.price.currency || DEFAULT_CURRENCY,
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
            payload.flights = { included: Boolean(payload.flights?.included), inventoryManaged: Boolean(payload.flights?.included && payload.flights?.inventoryManaged) };

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

            const saved = await saveAgentTour(payload);
            setDirty(false);
            setSuccess(form._id ? pageConfig.successMessages.updated : pageConfig.successMessages.created);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => onSaved(saved), 2000);
        } catch (err) {
            console.error('CreateTourForm submit error:', err);
            setError(err.message || 'Unexpected error');
        } finally {
            setSaving(false);
        }
    }

    function addArrayItem(key, item) { setDirty(true); setFormState(prev => ({ ...prev, [key]: [...(Array.isArray(prev[key]) ? prev[key] : []), { ...item, _key: genKey() }] })); }
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
        if (dirty && !window.confirm(pageConfig.unsavedWarning)) return;
        onCancel();
    }

    useEffect(() => {
        setSeasonOverlaps(findSeasonalOverlaps(form.seasonalPricing));
    }, [form.seasonalPricing]);

    useEffect(() => {
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

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
            importingJson={importingJson}
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
            handleImportJson={handleImportJson}
            handleBlur={handleBlur}
            onDismissSuccess={() => setSuccess(null)}
            variant={variant}
        />
    );
}
