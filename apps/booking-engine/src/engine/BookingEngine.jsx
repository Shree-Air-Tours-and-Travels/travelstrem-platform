import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Dropdown, GlobalLoader, InputField } from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";
import { emptyTraveller, getError, priceFrom, requestPricing, resolveTemplate, unwrap, validateStep } from "./bookingEngine.js";

const formatMoney = (value, currency = "INR") => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(value || 0)); } catch { return `${currency} ${Number(value || 0).toLocaleString("en-IN")}`; }
};

function Field({ field, value, error, onChange }) {
  return <label className="booking-engine__field" htmlFor={field.name}>
    <span>{field.label || field.name}{field.required ? " *" : ""}</span>
    {field.type === "select" ? <Dropdown
      variant="searchable"
      searchPlaceholder={field.searchPlaceholder || "Search options..."}
      items={(field.options || []).map((option) => ({ id: option.value ?? option, label: option.label ?? option, active: String(value ?? "") === String(option.value ?? option), onClick: () => onChange(field.name, option.value ?? option) }))}
      trigger={({ open }) => <Button className="booking-engine__dropdown-trigger" variant="outline" color="secondary" text={(field.options || []).find((option) => String(option.value ?? option) === String(value ?? ""))?.label || field.placeholder || "Select"} iconRight={open ? "chevronUp" : "chevronDown"} disabled={field.disabled || field.readOnly} />}
    />
      : field.type === "textarea" ? <textarea className="booking-engine__token-input" id={field.name} value={value ?? ""} placeholder={field.placeholder} disabled={field.disabled || field.readOnly} onChange={(event) => onChange(field.name, event.target.value)} />
        : field.type === "file" ? <input className="booking-engine__token-input" id={field.name} type="file" required={field.required} disabled={field.disabled || field.readOnly} onChange={(event) => onChange(field.name, event.target.files?.[0] || null)} accept={field.accept} />
          : field.type === "date" ? <input className="booking-engine__token-input" id={field.name} type="date" value={value ?? ""} readOnly={field.readOnly} disabled={field.disabled || field.readOnly} onChange={(event) => onChange(field.name, event.target.value)} />
            : <InputField variant={field.type === "number" ? "number" : field.type || "text"} value={value ?? ""} placeholder={field.placeholder} disabled={field.disabled || field.readOnly} error={error} maxLength={field.maxLength} onChange={(nextValue) => onChange(field.name, nextValue)} />}
    {error && <small className="booking-engine__error-text">{error}</small>}
  </label>;
}

function Summary({ trip, travellers, addons, pricing, currency }) {
  const rows = pricing?.breakdown || pricing?.items || [];
  return <aside className="booking-engine__summary">
    <h2>{pricing?.summaryTitle || "Booking Summary"}</h2>
    {trip && <div className="booking-engine__trip"><strong>{trip.name || trip.title || trip.packageName}</strong><span>{trip.destination || trip.location || ""}</span><span>{trip.startDate || ""}{trip.endDate ? ` – ${trip.endDate}` : ""}</span></div>}
    <p>Travellers <strong>{travellers.length}</strong></p>
    {pricing?.availability?.seatsAvailable != null && <p className={pricing.availability.seatsAvailable < travellers.length ? "booking-engine__seats is-low" : "booking-engine__seats"}>Seats available <strong>{pricing.availability.seatsAvailable}{pricing.availability.totalSeats != null ? ` / ${pricing.availability.totalSeats}` : ""}</strong></p>}
    {rows.map((row) => <p key={row.id || row.label}><span>{row.label || row.name}</span><strong>{formatMoney(row.amount, currency)}</strong></p>)}
    <hr /><p className="booking-engine__total"><span>{pricing?.grandTotalLabel || "Grand Total"}</span><strong>{formatMoney(pricing?.grandTotal ?? pricing?.total, currency)}</strong></p>
    {pricing?.tokenAmount != null && <p><span>Token Amount</span><strong>{formatMoney(pricing.tokenAmount, currency)}</strong></p>}
    {pricing?.remainingBalance != null && <p><span>Remaining Balance</span><strong>{formatMoney(pricing.remainingBalance, currency)}</strong></p>}
  </aside>;
}

function Review({ trip, values, travellers, addons, pricing, currency }) {
  return <div className="booking-engine__review">
    <section className="booking-engine__review-trip"><p className="booking-engine__review-label">Trip</p><h2>{trip?.title || trip?.name || "Selected trip"}</h2><p>{trip?.location || trip?.destination || ""}</p><p><strong>Trip ID:</strong> {trip?.slug || trip?.id || trip?._id || "—"}</p><p><strong>Dates:</strong> {values.startDate || trip?.startDate || "—"} {values.endDate ? `– ${values.endDate}` : trip?.endDate ? `– ${trip.endDate}` : ""}</p></section>
    <section><p className="booking-engine__review-label">Travellers ({travellers.length})</p><div className="booking-engine__traveller-list">{travellers.map((traveller, index) => <article key={index}><strong>{index + 1}. {[traveller.title, traveller.firstName, traveller.middleName, traveller.lastName].filter(Boolean).join(" ") || "Traveller details pending"}</strong><span>{traveller.age ? `Age ${traveller.age}` : "Age —"} · {traveller.mobile || traveller.phone || "Mobile —"}</span><span>{traveller.country || traveller.countryOfResidence || "Country —"}</span><span>{traveller.aadhaar?.name || "Aadhaar document attached"}</span></article>)}</div></section>
    <section><p className="booking-engine__review-label">Selected benefits</p>{(addons || []).filter((item) => item.selected).map((item) => <p className="booking-engine__review-line" key={item.id || item.name}><span>{item.name}</span><strong>{formatMoney(item.price, currency)}</strong></p>)}</section>
    <section className="booking-engine__review-total"><p><span>Grand total</span><strong>{formatMoney(pricing?.grandTotal ?? pricing?.total, currency)}</strong></p><p><span>Token amount</span><strong>{formatMoney(pricing?.tokenAmount, currency)}</strong></p><p><span>Remaining balance</span><strong>{formatMoney(pricing?.remainingBalance, currency)}</strong></p></section>
  </div>;
}

export function BookingEngine({ configEndpoint = "/booking-engine-config.json", submitEndpoint, product, trip: initialTrip, bookingBasePath = "" }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productKey = product || searchParams.get("product") || "trevio";
  const [config, setConfig] = useState(null);
  const [trip, setTrip] = useState(initialTrip || null);
  const [pricing, setPricing] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [travellers, setTravellers] = useState([]);
  const [values, setValues] = useState({});
  const [addons, setAddons] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pricingTimer = useRef(null);
  const userInteracted = useRef(false);

  const dateInputValue = (value) => {
    if (!value) return "";
    const text = String(value);
    const parts = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (parts) {
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const month = months.indexOf(parts[2].slice(0, 3).toLowerCase());
      if (month >= 0) return `${parts[3]}-${String(month + 1).padStart(2, "0")}-${String(parts[1]).padStart(2, "0")}`;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    let cancelled = false;
    fetchData(`${configEndpoint}?product=${encodeURIComponent(productKey)}`).then(async (response) => {
      if (cancelled) return;
      const data = unwrap(response);
      if (response?.status === "error") throw new Error(getError(response, "Unable to load booking configuration"));
      const nextConfig = data.config || data;
      setConfig(nextConfig);
      setAddons((data.addons || nextConfig.addons || []).map((item) => ({ ...item, selected: item.selected ?? item.defaultSelected ?? false })));
      const travellerStep = (nextConfig.steps || []).find((item) => item.type === "travellers" || item.key === "travellers");
      setTravellers([emptyTraveller(travellerStep?.fields || nextConfig.travellerFields || [])]);
      if (!initialTrip && nextConfig.tripEndpoint) {
        const tripRef = searchParams.get("tripRef") || searchParams.get("tourRef") || "";
        const tripResponse = await fetchData(resolveTemplate(nextConfig.tripEndpoint, { tripRef }), { params: { ref: tripRef, tripRef } });
        const tripData = unwrap(tripResponse);
        const received = tripData.trip || (tripData.trips || []).find((item) => String(item.id || item._id || item.slug) === tripRef) || tripData;
        if (received && (received.id || received._id || received.title || received.name)) setTrip(received);
      }
    }).catch((err) => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [configEndpoint, initialTrip, productKey, searchParams]);

  const steps = config?.steps || [];
  const step = steps[stepIndex] || {};
  const currency = pricing?.currency || config?.currency || "INR";

  useEffect(() => {
    if (!config || !trip) return;
    const tripStep = steps.find((item) => item.type === "trip");
    const travellerStep = steps.find((item) => item.type === "travellers");
    const tripDefaults = (tripStep?.fields || []).reduce((result, field) => {
      if (field.autoFrom) {
        const source = field.autoFrom.split(".").slice(1).reduce((value, key) => value?.[key], trip);
        result[field.name] = field.type === "date" ? dateInputValue(source) : source ?? "";
      } else if (field.defaultValue != null) result[field.name] = field.defaultValue;
      return result;
    }, {});
    setValues((current) => ({ ...tripDefaults, ...current }));
    const countField = (tripStep?.fields || []).find((field) => ["travellers", "travelers", "guests"].includes(field.name));
    const count = Math.max(1, Number(tripDefaults[countField?.name] || countField?.defaultValue || 1));
    setTravellers((current) => {
      const next = [...current];
      while (next.length < count) next.push(emptyTraveller(travellerStep?.fields || []));
      return next.slice(0, count);
    });
  }, [config, trip]);
  const updatePricing = useCallback(async (nextValues = values, nextTravellers = travellers, nextAddons = addons) => {
    if (!config) return;
    try {
      const result = await requestPricing(config, { product: productKey, tripId: trip?.id || trip?._id, tripRef: trip?.slug || trip?.id || trip?._id, trip, values: nextValues, travellers: nextTravellers, addons: nextAddons.filter((item) => item.selected).map((item) => item.id || item.code || item.name) });
      if (result?.pricing) { setPricing(result.pricing); setError(""); }
      if (result?.addons?.length) setAddons((current) => result.addons.map((item) => ({ ...item, selected: current.find((existing) => (existing.id || existing.code || existing.name) === (item.id || item.code || item.name))?.selected || false })));
    } catch (err) { setError(getError(err, "Unable to refresh pricing")); }
  }, [addons, config, productKey, travellers, trip, values]);

  const queuePricing = useCallback((nextValues, nextTravellers, nextAddons) => {
    window.clearTimeout(pricingTimer.current);
    pricingTimer.current = window.setTimeout(() => updatePricing(nextValues, nextTravellers, nextAddons), 300);
  }, [updatePricing]);

  useEffect(() => { if (config && trip && userInteracted.current) updatePricing(); }, [config, trip]);

  const changeValue = (name, value) => {
    userInteracted.current = true;
    const next = { ...values, [name]: value };
    let nextTravellers = travellers;
    if (["travellers", "travelers", "guests"].includes(name)) {
      const count = Math.max(1, Number(value) || 1);
      nextTravellers = [...travellers];
      while (nextTravellers.length < count) nextTravellers.push(emptyTraveller((steps.find((item) => item.type === "travellers") || {}).fields || []));
      nextTravellers = nextTravellers.slice(0, count);
      setTravellers(nextTravellers);
    }
    setValues(next); queuePricing(next, nextTravellers, addons);
  };
  const changeTraveller = (index, name, value) => { userInteracted.current = true; const next = travellers.map((item, i) => i === index ? { ...item, [name]: value } : item); setTravellers(next); queuePricing(values, next, addons); };
  const changeAddon = (index, selected) => {
    userInteracted.current = true;
    const item = addons[index];
    const next = addons.map((entry, i) => item?.selectionType === "single" && selected ? { ...entry, selected: i === index } : i === index ? { ...entry, selected } : entry);
    setAddons(next); queuePricing(values, travellers, next);
  };

  const next = () => {
    const nextErrors = step.type === "travellers" ? travellers.reduce((all, traveller, index) => { const result = validateStep(step, traveller); Object.entries(result).forEach(([key, value]) => { all[`travellers.${index}.${key}`] = value; }); return all; }, {}) : validateStep(step, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  const submit = async () => {
    setSaving(true); setError("");
    try {
      const availableSeats = pricing?.availability?.seatsAvailable;
      if (availableSeats != null && travellers.length > Number(availableSeats)) {
        setStepIndex(0);
        throw new Error(`Only ${availableSeats} seats remain for this trip.`);
      }
      const endpoint = resolveTemplate(submitEndpoint || config.submitEndpoint || "/bookings", { product: productKey });
      const response = await fetchData(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: { product: productKey, tourId: trip?.id || trip?._id, tripId: trip?.id || trip?._id, ...values, travellers, travelers: travellers, addons: addons.filter((item) => item.selected), pricing, termsAccepted: true } });
      if (response?.status !== "success") throw new Error(getError(response, "Booking request could not be submitted"));
      const booking = unwrap(response); const bookingId = booking.bookingId || booking.id || booking._id || booking.booking?.id;
      if (!bookingId) throw new Error("Booking response did not include a booking ID");
      navigate(`${bookingBasePath}/bookings/${bookingId}/checkout?product=${encodeURIComponent(productKey)}`, { state: { quote: booking } });
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  if (loading) return <GlobalLoader visible text="Loading booking engine..." />;
  if (error && !config) return <main className="booking-engine__error"><h1>Booking engine</h1><p>{error}</p></main>;
  return <main className="booking-engine__page"><div className="booking-engine__content"><header><p className="booking-engine__eyebrow">{config.title || "Booking"}</p><h1>{step.title || step.label}</h1><nav>{steps.map((item, index) => <span className={index === stepIndex ? "is-active" : index < stepIndex ? "is-done" : ""} key={item.key || index}>{item.label || item.title || `Step ${index + 1}`}</span>)}</nav></header>
    {error && <p className="booking-engine__alert">{error}</p>}
    <section className="booking-engine__layout"><div className="booking-engine__form">
      {step.type === "trip" && <div className="booking-engine__trip-card"><p className="booking-engine__review-label">Selected trip</p><h2>{trip?.name || trip?.title || trip?.packageName}</h2><p>{trip?.destination || trip?.location}</p><p>{trip?.description || trip?.desc}</p></div>}
      {step.type === "travellers" ? travellers.map((traveller, index) => <fieldset key={index}><legend>{(step.travellerLabel || "Traveller {number}").replace("{number}", index + 1)}</legend>{(step.fields || []).map((field) => <Field key={field.name} field={field} value={traveller[field.name]} error={errors[`travellers.${index}.${field.name}`]} onChange={(name, value) => changeTraveller(index, name, value)} />)}</fieldset>) : (step.fields || []).map((field) => <Field key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={changeValue} />)}
      {step.type === "addons" && <div className="booking-engine__addons">{addons.map((item, index) => <label key={item.id || item.name}><input name={item.selectionType === "single" ? "booking-addon" : item.id || item.name} type={item.selectionType === "multiple" ? "checkbox" : "radio"} checked={item.selected} onChange={(event) => changeAddon(index, event.target.checked)} /> <strong>{item.name}</strong><span>{item.description}</span><b>{formatMoney(item.price, currency)}</b></label>)}</div>}
      {step.type === "review" && <Review trip={trip} values={values} travellers={travellers} addons={addons} pricing={pricing} currency={currency} />}
      <div className="booking-engine__actions"><button type="button" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={!stepIndex}>Back</button>{stepIndex < steps.length - 1 ? <button type="button" onClick={next}>Continue</button> : <button type="button" onClick={submit} disabled={saving}>{saving ? "Submitting..." : (config.submitLabel || "Submit Quote")}</button>}</div>
    </div><Summary trip={trip} travellers={travellers} addons={addons} pricing={pricing} currency={currency} /></section>
  </div></main>;
}
