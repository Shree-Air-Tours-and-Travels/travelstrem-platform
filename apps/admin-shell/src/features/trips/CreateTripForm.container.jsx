import React, { useState, useEffect, useCallback } from "react";
import { saveTrip, uploadTripImage } from "../../services/adminService";
import CreateTripFormView from "./CreateTripForm.view";

const STEPS = ['Basic', 'Journey', 'Inclusions', 'Content', 'Settings', 'Review'];

const TRIP_TAGS = ["weekends", "mountains", "roadtrips", "international"];

const TRIP_CATEGORIES = [
    "weekend", "mountains", "beaches", "roadtrips", "international", "culture", "adventure",
];

function coerceDuration(val) {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val !== null) {
        const from = val.from || "";
        const to = val.to || "";
        if (from && to) return `${from} – ${to}`;
        if (from) return String(from);
        if (to) return String(to);
    }
    return String(val);
}

function calcDuration(startStr, endStr) {
    if (!startStr || !endStr) return "";
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start) || isNaN(end) || end <= start) return "";
    const diffMs = end - start;
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const nights = Math.max(0, totalDays - 1);
    return `${nights}N/${totalDays}D`;
}

function coercePhotos(initial) {
    const photos = Array.isArray(initial?.photos) ? [...initial.photos] : [];
    const image = initial?.image;
    if (image && !photos.includes(image)) {
        photos.unshift(image);
    }
    return photos;
}

function slugify(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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

export default function CreateTripForm({ initial = null, onCancel = () => {}, onSaved = () => {} }) {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [importingJson, setImportingJson] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [form, setFormState] = useState(() => {
        const blank = {
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
            itinerary: [],
            inclusions: [],
            exclusions: [],
            featured: false,
            isListed: true,
            cancellationPolicy: "Full refund up to 7 days before departure; 50% refund within 7 days; no refund within 48 hours.",
            status: "listed",
            sortOrder: 0,
        };
        if (!initial) return blank;
        const merged = { ...blank, ...initial };
        merged.duration = coerceDuration(initial.duration);
        merged.photos = coercePhotos(initial);
        merged.image = initial.image || merged.photos[0] || "";
        merged.price = { ...blank.price, ...(initial.price || {}) };
        merged.availability = { ...blank.availability, ...(initial.availability || {}) };
        return merged;
    });

    function setForm(valueOrFn) {
        setDirty(true);
        setFormState(valueOrFn);
    }

    function setAt(path, value) {
        setForm(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            const parts = path.split(".");
            let cur = copy;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!cur[parts[i]]) cur[parts[i]] = {};
                cur = cur[parts[i]];
            }
            cur[parts[parts.length - 1]] = value;
            return copy;
        });
    }

    function handleImportJson(jsonText) {
        if (!String(jsonText || "").trim()) {
            setError("Paste a trip JSON object before importing.");
            return false;
        }
        setError(null);
        setSuccess(null);
        setImportingJson(true);
        try {
            const parsed = JSON.parse(jsonText);
            const imported = unwrapTripJson(parsed);
            if (!imported) throw new Error("The JSON file must contain one trip object.");
            if (!imported.title && !imported.slug) {
                throw new Error("This does not look like a trip JSON file. A title or slug is required.");
            }

            setFormState(prev => {
                const next = {
                    ...prev,
                    ...imported,
                    price: {
                        ...prev.price,
                        ...(typeof imported.price === "number" ? { amount: imported.price } : (imported.price || {})),
                    },
                    availability: { ...prev.availability, ...(imported.availability || {}) },
                    preferences: { ...(prev.preferences || {}), ...(imported.preferences || {}) },
                };

                next.slug = imported.slug || slugify(imported.title);
                next.duration = coerceDuration(imported.duration)
                    || calcDuration(imported.startDate, imported.endDate);
                next.photos = coercePhotos(imported);
                next.image = imported.image || next.photos[0] || "";
                next.itinerary = Array.isArray(imported.itinerary) ? imported.itinerary : [];
                next.dates = Array.isArray(imported.dates) ? imported.dates : [];
                next.chips = Array.isArray(imported.chips) ? imported.chips : [];
                next.tags = Array.isArray(imported.tags) ? imported.tags : [];
                next.inclusions = Array.isArray(imported.inclusions) ? imported.inclusions : [];
                next.exclusions = Array.isArray(imported.exclusions) ? imported.exclusions : [];
                next.reviews = Array.isArray(imported.reviews) ? imported.reviews : [];

                if (!initial?._id) {
                    delete next._id;
                    delete next.id;
                    delete next.__v;
                    delete next.createdAt;
                    delete next.updatedAt;
                } else {
                    next._id = initial._id;
                }
                return next;
            });
            setDirty(true);
            setStep(0);
            setSuccess("JSON imported. Review every step before submitting.");
            return true;
        } catch (importError) {
            setError(importError instanceof SyntaxError
                ? "The pasted content is not valid JSON. Check commas, quotes, and brackets."
                : (importError.message || "Could not import this trip JSON file."));
            return false;
        } finally {
            setImportingJson(false);
        }
    }

    function next() { setStep(s => Math.min(STEPS.length - 1, s + 1)); }
    function back() { setStep(s => Math.max(0, s - 1)); }

    function validateAll() {
        const errs = {};
        if (!form.title) errs.title = "Title is required";
        if (!form.location) errs.location = "Location is required";
        if (!form.category) errs.category = "Category is required";
        if (!form.price?.amount || Number(form.price.amount) <= 0) errs.price = "Price must be greater than 0";
        return errs;
    }

    const handleDateChange = useCallback((field, value) => {
        setForm(prev => {
            const next = { ...prev, [field]: value || null };
            if (field === "startDate" || field === "endDate") {
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
            }
            return next;
        });
    }, [setForm]);

    async function submit(e) {
        e?.preventDefault?.();
        setError(null);
        setSuccess(null);

        const errs = validateAll();
        if (Object.keys(errs).length > 0) {
            setError(Object.values(errs)[0]);
            return;
        }

        setSaving(true);
        try {
            const payload = JSON.parse(JSON.stringify(form));
            payload.price.amount = Number(payload.price.amount);
            payload.price.tokenAmount = Number(payload.price.tokenAmount || 1999);
            delete payload.rating;
            payload.sortOrder = Number(payload.sortOrder || 0);
            payload.itinerary = (payload.itinerary || []).map((it, idx) => ({
                ...it,
                day: Number(it.day || idx + 1),
                title: it.title || "",
                summary: it.summary || "",
                location: it.location || "",
                activities: Array.isArray(it.activities) ? it.activities : [],
                meals: it.meals || "",
                accommodation: it.accommodation || "",
            }));
            payload.tags = Array.isArray(payload.tags) ? payload.tags : [];
            payload.chips = Array.isArray(payload.chips) ? payload.chips : [];
            payload.inclusions = Array.isArray(payload.inclusions) ? payload.inclusions : [];
            payload.exclusions = Array.isArray(payload.exclusions) ? payload.exclusions : [];
            payload.photos = Array.isArray(payload.photos) ? payload.photos : [];
            payload.dates = Array.isArray(payload.dates) ? payload.dates : [];

            if (payload.endDate) {
                const endDate = new Date(payload.endDate);
                const now = new Date();
                if (endDate < now && payload.status !== "completed" && payload.status !== "cancelled") {
                    payload.status = "completed";
                }
            }

            const saved = await saveTrip(payload);
            setDirty(false);
            setSuccess(form._id ? "Trip updated!" : "Trip created!");
            setTimeout(() => onSaved(saved), 1500);
        } catch (err) {
            setError(err.message || "Unexpected error");
        } finally {
            setSaving(false);
        }
    }

    function addArrayItem(key, item) {
        setDirty(true);
        setFormState(prev => ({ ...prev, [key]: [...(Array.isArray(prev[key]) ? prev[key] : []), item] }));
    }
    function updateArrayItem(key, idx, item) {
        setDirty(true);
        setFormState(prev => {
            const copy = { ...prev };
            copy[key] = [...(copy[key] || [])];
            copy[key][idx] = item;
            return copy;
        });
    }
    function removeArrayItem(key, idx) {
        setDirty(true);
        setFormState(prev => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== idx) }));
    }
    function moveArrayItem(key, fromIdx, toIdx) {
        setDirty(true);
        setFormState(prev => {
            const copy = { ...prev };
            const arr = [...(copy[key] || [])];
            if (toIdx < 0 || toIdx >= arr.length) return prev;
            const [moved] = arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, moved);
            copy[key] = arr;
            return copy;
        });
    }

    async function handleUploadImage(file) {
        setUploading(true);
        try {
            const url = await uploadTripImage(file);
            setForm(prev => {
                const photos = [...(prev.photos || []), url].filter(Boolean);
                return { ...prev, image: prev.image || url, photos };
            });
            return url;
        } catch (e) {
            setError(e.message || "Upload failed");
            return null;
        } finally {
            setUploading(false);
        }
    }

    function removePhoto(idx) {
        setForm(prev => {
            const photos = prev.photos.filter((_, i) => i !== idx);
            const image = prev.image === prev.photos[idx] ? (photos[0] || "") : prev.image;
            return { ...prev, photos, image };
        });
    }

    function setMainPhoto(idx) {
        setForm(prev => {
            const photos = [...prev.photos];
            const [moved] = photos.splice(idx, 1);
            photos.unshift(moved);
            return { ...prev, photos, image: moved };
        });
    }

    function handleCancel() {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        onCancel();
    }

    useEffect(() => {
        if (!dirty) return;
        function handler(e) { e.preventDefault(); e.returnValue = ""; }
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    return (
        <CreateTripFormView
            form={form}
            step={step}
            saving={saving}
            uploading={uploading}
            importingJson={importingJson}
            error={error}
            success={success}
            onCancel={handleCancel}
            submit={submit}
            next={next}
            back={back}
            setForm={setForm}
            setAt={setAt}
            handleDateChange={handleDateChange}
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
            moveArrayItem={moveArrayItem}
            handleUploadImage={handleUploadImage}
            handleImportJson={handleImportJson}
            removePhoto={removePhoto}
            setMainPhoto={setMainPhoto}
            TRIP_TAGS={TRIP_TAGS}
            TRIP_CATEGORIES={TRIP_CATEGORIES}
        />
    );
}
