import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GlobalLoader, FloatingActionBar, EmptyState, scrollTargetsToTop } from "@packages/trem-ui";
import { fetchData, requestShellNavigation, useMasterOptions } from "@packages/trem-utils";
import BookingLayout from "../components/BookingLayout.jsx";
import BookingSidebar from "../components/BookingSidebar.jsx";
import DepartureStep from "../components/DepartureStep.jsx";
import CustomizeStep from "../components/TrevistaCustomizeStep.jsx";
import TripStep from "../components/TripStep.jsx";
import TravellerStep from "../components/TravellerStep.jsx";
import AddOnsStep from "../components/AddOnsStep.jsx";
import ReviewStep from "../components/ReviewStep.jsx";
import CheckoutStep from "../components/CheckoutStep.jsx";
import BookingConfirmation from "../components/BookingPaymentConfirmation.jsx";
import { useBookingFlow } from "../hooks/useBookingFlow.js";
import { useBookingApi } from "../hooks/useBookingApi.js";
import { formatTourLocation } from "../utils/format.js";

const WHATSAPP_GROUP_URL = process.env.REACT_APP_WHATSAPP_GROUP_URL;
const SUPPORT_PHONE = process.env.REACT_APP_SUPPORT_PHONE;

const CONFIRMATION_STORAGE_PREFIX = "trem_booking_confirmation_";
const RESUME_STORAGE_KEY = "trem_booking_resume";

const bookingKey = (product, productRef) => `${product}:${productRef}`;

function getResumeKey() {
  try { return sessionStorage.getItem(RESUME_STORAGE_KEY) || ""; } catch { return ""; }
}

function setResumeKey(key) {
  try { sessionStorage.setItem(RESUME_STORAGE_KEY, key); } catch {}
}

function clearResumeKey(key = "") {
  try {
    if (!key || sessionStorage.getItem(RESUME_STORAGE_KEY) === key) sessionStorage.removeItem(RESUME_STORAGE_KEY);
  } catch {}
}

function scrollToFirstError() {
  window.setTimeout(() => {
    const target = document.querySelector(
      "[data-invalid='true'], .be-field__error, [role='alert']",
    );
    target?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    target?.querySelector?.("button, input, select, textarea")?.focus?.({ preventScroll: true });
  }, 120);
}

function getConfirmationStorageKey(product, productRef) {
  return `${CONFIRMATION_STORAGE_PREFIX}${product}_${productRef}`;
}

function persistConfirmation(product, productRef, bookingData) {
  try {
    const key = getConfirmationStorageKey(product, productRef);
    const tripTitle = bookingData?.trip?.title || bookingData?.tour?.title || "";
    const minimal = {
      id: bookingData?.id || bookingData?._id,
      bookingRef: bookingData?.bookingRef,
      status: bookingData?.status,
      product,
      createdAt: bookingData?.createdAt,
      ...(tripTitle ? { trip: { title: tripTitle } } : {}),
    };
    localStorage.setItem(key, JSON.stringify(minimal));
  } catch {}
}

function loadConfirmation(product, productRef) {
  try {
    const key = getConfirmationStorageKey(product, productRef);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearConfirmation(product, productRef) {
  try {
    const key = getConfirmationStorageKey(product, productRef);
    localStorage.removeItem(key);
  } catch {}
}

function SpotsFullView({ productData, totalSeats, onExit }) {
  const tripTitle = productData?.title || "This trip";
  const tripImage = productData?.photo || productData?.image || "";
  const tripLocation = formatTourLocation(productData || {});
  const tripDuration = productData?.duration || "";
  const tripPrice = productData?.price || productData?.priceInfo?.min || 0;
  const whatsappMsg = encodeURIComponent(`Hi, I'm interested in ${tripTitle} but it's fully booked. Are there alternative dates?`);

  return (
    <div className="be-sold-out">
      <div className="be-sold-out__hero">
        {tripImage && <img src={tripImage} alt={tripTitle} className="be-sold-out__hero-img" />}
        <div className="be-sold-out__hero-overlay" />
        <span className="be-sold-out__badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          Spots Full
        </span>
      </div>

      <div className="be-sold-out__body">
        <h2 className="be-sold-out__title">{tripTitle}</h2>
        {(tripLocation || tripDuration) && (
          <p className="be-sold-out__meta">
            {tripLocation && <span>{tripLocation}</span>}
            {tripLocation && tripDuration && <span className="be-sold-out__meta-sep">·</span>}
            {tripDuration && <span>{tripDuration}</span>}
          </p>
        )}

        <div className="be-sold-out__info">
          <div className="be-sold-out__info-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            <span>All {totalSeats || "—"} spots are currently reserved</span>
          </div>
          <div className="be-sold-out__info-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span>We release new dates regularly — join the waitlist to get notified</span>
          </div>
        </div>

        <div className="be-sold-out__cta-group">
          {process.env.REACT_APP_WHATSAPP_PHONE ? (
            <a href={`https://wa.me/${process.env.REACT_APP_WHATSAPP_PHONE}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="be-sold-out__cta be-sold-out__cta--primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Talk to us on WhatsApp
            </a>
          ) : (
            <span className="be-sold-out__cta be-sold-out__cta--disabled">WhatsApp not configured</span>
          )}
          {WHATSAPP_GROUP_URL ? (
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" className="be-sold-out__cta be-sold-out__cta--secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Join waitlist group
            </a>
          ) : (
            <span className="be-sold-out__cta be-sold-out__cta--disabled">Waitlist group not configured</span>
          )}
          {SUPPORT_PHONE ? (
            <a href={`tel:${SUPPORT_PHONE}`} className="be-sold-out__cta be-sold-out__cta--outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              Call {SUPPORT_PHONE}
            </a>
          ) : (
            <span className="be-sold-out__cta be-sold-out__cta--disabled">Phone not configured</span>
          )}
        </div>

        <button type="button" className="be-sold-out__back" onClick={onExit}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to trips
        </button>
      </div>
    </div>
  );
}

export default function BookingEntryPage({ userSession, onRequireAuth }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const product = searchParams.get("product") || "trevista";
  const productRef = searchParams.get("tripRef") || searchParams.get("tourRef") || "";
  const returnTo = searchParams.get("returnTo") || "";
  const initialRoomType = searchParams.get("roomType") || "";

  const [productData, setProductData] = useState(null);
  const [loadedBookingKey, setLoadedBookingKey] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [availabilityNotice, setAvailabilityNotice] = useState("");
  const [addons, setAddons] = useState([]);
  const [serverPricing, setServerPricing] = useState(null);
  const [customizeOptions, setCustomizeOptions] = useState({ roomOptions: null, transportOptions: null });
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(() => {
    if (productRef) {
      const saved = loadConfirmation(product, productRef);
      if (saved) return saved;
    }
    return null;
  });
  const [flowReady, setFlowReady] = useState(false);

  const api = useBookingApi();
  const { options: customizationMasterOptions, error: customizationOptionsError } = useMasterOptions(
    product === "trevista" ? ["trevista.defaultRoomOptions", "trevista.transportOptions", "booking.travellerTypeOptions"] : [],
  );
  const calculatePricing = api.calculatePricing;
  const createBookingQuote = api.createBookingQuote;
  const [activeQuoteId, setActiveQuoteId] = useState("");
  const flow = useBookingFlow({ product, tour: productData });
  const flightInventoryManaged = product === "trevista" && Boolean(productData?.flights?.included && productData?.flights?.inventoryManaged);
  const travellersRef = useRef(flow.travellers);
  const addonsRef = useRef(addons);
  const couponRef = useRef(couponCode);
  travellersRef.current = flow.travellers;
  addonsRef.current = addons;
  couponRef.current = couponCode;
  const trevioPreferenceKey = flow.travellers
    .map((traveller) => [
      traveller.mealPreference,
      traveller.packageType,
      traveller.drinkType,
    ].join(":"))
    .join("|");
  const prevStepRef = useRef(flow.currentStep);
  const quoteRequestRef = useRef({ signature: "", controller: null, sequence: 0 });
  const bookingAttemptKeyRef = useRef(
    globalThis.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const guestSessionIdRef = useRef((() => {
    try {
      const existing = sessionStorage.getItem("trem_guest_booking_session");
      if (existing) return existing;
      const created = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("trem_guest_booking_session", created);
      return created;
    } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  })());

  useEffect(() => {
    let cancelled = false;

    async function hydrateAuthenticatedContact() {
      try {
        const session = await fetchData("/auth/session");
        const user = session?.user || session?.componentData?.data?.user;
        if (cancelled || !user) return;

        flow.setContact({
          name: String(user.name || "").trim(),
          email: String(user.email || "").trim(),
          phone: String(user.phone || "").trim(),
        });
      } catch {
        // Authentication handling remains with the application shell.
      }
    }

    hydrateAuthenticatedContact();
    return () => {
      cancelled = true;
    };
  }, [productRef]);

  const refreshPricing = useCallback(async ({
    nextAddons,
    nextCouponCode,
    showCouponResult = false,
    force = false,
  } = {}) => {
    if (!productRef || !productData) return null;
    const effectiveAddons = nextAddons || addonsRef.current;
    const effectiveCouponCode = nextCouponCode ?? couponRef.current;
    const selectedAddonIds = effectiveAddons
      .filter((addon) => addon.selected)
      .map((addon) => addon.id || addon.code || addon.name);
    const requestPayload = product === "trevio" ? {
      travellers: travellersRef.current,
      roomType: flow.trip.roomType,
      addons: selectedAddonIds,
      couponCode: effectiveCouponCode.trim(),
    } : {
      startDate: flow.trip.startDate,
      endDate: flow.trip.endDate,
      adults: flow.trip.adults,
      children: flow.trip.children,
      infants: flow.trip.infants,
      hotelOptionId: flow.trip.roomType || undefined,
      transportOptionId: flow.trip.transport || undefined,
      selectedAddonIds,
      couponCode: effectiveCouponCode.trim(),
    };
    const signature = JSON.stringify([product, productRef, requestPayload]);
    if (!force && signature === quoteRequestRef.current.signature) return null;
    quoteRequestRef.current.controller?.abort();
    const controller = new AbortController();
    const sequence = quoteRequestRef.current.sequence + 1;
    quoteRequestRef.current = { signature, controller, sequence };
    try {
      const result = product === "trevio"
        ? await calculatePricing(product, productRef, requestPayload)
        : await createBookingQuote(productRef, requestPayload, controller.signal, guestSessionIdRef.current);
      if (sequence !== quoteRequestRef.current.sequence) return null;
      if (product === "trevista" && result?.quoteId) setActiveQuoteId(result.quoteId);
      if (result) setServerPricing(product === "trevista" ? result : result.pricing);
      if (product === "trevista" && result?.availability?.inventoryManaged) {
        setAvailability((current) => ({ ...current, seatsAvailable: result.availability.seatsAvailable }));
      }
      setAvailabilityNotice("");
      if (Array.isArray(result?.roomOptions)) {
        setCustomizeOptions((current) => ({ ...current, roomOptions: result.roomOptions }));
      }
      if (Array.isArray(result?.transportOptions)) {
        setCustomizeOptions((current) => ({ ...current, transportOptions: result.transportOptions }));
      }
      if (Array.isArray(result?.addons)) {
        setAddons((current) => result.addons.map((addon) => ({
          ...addon,
          selected: Boolean(addon.included) || effectiveAddons.some(
            (selectedAddon) =>
              selectedAddon.selected
              && (selectedAddon.id || selectedAddon.code || selectedAddon.name)
                === (addon.id || addon.code || addon.name),
          ),
        })));
      }
      if (showCouponResult) {
        setCouponStatus(result?.coupon || {
          valid: false,
          message: "This coupon is not available.",
        });
      }
      return result;
    } catch (pricingError) {
      if (controller.signal.aborted) return null;
      setAvailabilityNotice(pricingError.message || "Unable to refresh pricing");
      if (/seat/i.test(pricingError.message || "")) {
        setServerPricing((current) => ({ ...current, availability: { ...current?.availability, canBook: false, validationMessage: pricingError.message } }));
      }
      if (showCouponResult) {
        setCouponStatus({ valid: false, message: pricingError.message });
      }
      return null;
    }
  }, [calculatePricing, createBookingQuote, flow.trip.roomType, flow.trip.transport, flow.trip.startDate, flow.trip.endDate, flow.trip.adults, flow.trip.children, flow.trip.infants, product, productData, productRef]);

  const handleExit = useCallback(() => {
    // Exiting is the only action that marks this exact booking journey as resumable.
    setResumeKey(bookingKey(product, productRef));
    clearConfirmation(product, productRef);
    if (returnTo) {
      const target = new URL(returnTo, window.location.origin);
      if (target.origin === window.location.origin) {
        navigate(`${target.pathname}${target.search}${target.hash}`);
      } else {
        window.location.assign(target.toString());
      }
    } else {
      navigate(-1);
    }
  }, [navigate, returnTo, product, productRef]);

  const initializedBookingKeyRef = useRef("");
  useEffect(() => {
    const currentKey = bookingKey(product, productRef);
    if (initializedBookingKeyRef.current === currentKey) return;
    setFlowReady(false);
    if (!productRef || initialLoading || !productData || loadedBookingKey !== currentKey) return;
    initializedBookingKeyRef.current = currentKey;
    if (getResumeKey() !== currentKey) {
      clearConfirmation(product, productRef);
      flow.startBooking({ product, tour: productData });
    }
    setFlowReady(true);
  }, [product, productRef, initialLoading, productData, loadedBookingKey, flow.startBooking]);

  useEffect(() => {
    setProductData(null);
    setLoadedBookingKey("");
    if (!productRef) { setInitialLoading(false); setLoadError("No trip or tour reference provided."); return; }
    setInitialLoading(true);
    api.loadProduct(product, productRef)
      .then((data) => {
        setProductData(data);
        setLoadedBookingKey(bookingKey(product, productRef));
        if (data?.availability) {
          setAvailability(data.availability);
        }
      })
      .catch((err) => { setLoadError(err?.message || "Failed to load trip details."); })
      .finally(() => setInitialLoading(false));
  }, [productRef, product]);

  const selectedAddonKey = addons.filter((addon) => addon.selected).map((addon) => addon.id || addon.code || addon.name).sort().join("|");
  useEffect(() => {
    if (!productData || !flowReady) return undefined;
    if (product === "trevista") {
      setActiveQuoteId("");
      setServerPricing(null);
    }
    const timer = window.setTimeout(() => refreshPricing(), 350);
    return () => window.clearTimeout(timer);
  }, [productData, flowReady, product, flow.guestsCount, flow.trip.roomType, flow.trip.transport, flow.trip.startDate, flow.trip.endDate, selectedAddonKey, trevioPreferenceKey, refreshPricing]);

  useEffect(() => () => quoteRequestRef.current.controller?.abort(), []);

  useEffect(() => {
    if (!flightInventoryManaged || !productRef) return undefined;
    let active = true;
    const refreshAvailability = async () => {
      const data = await api.loadProduct(product, productRef).catch(() => null);
      if (active && data?.availability) {
        setAvailability(data.availability);
        const available = data.availability.seatsAvailable;
        if (available != null && travellersRef.current.length > Number(available)) {
          const validationMessage = `Only ${available} flight seats are currently available`;
          setServerPricing((current) => ({ ...current, availability: { ...current?.availability, canBook: false, validationMessage } }));
          setAvailabilityNotice(validationMessage);
        }
      }
    };
    const interval = window.setInterval(refreshAvailability, 15000);
    const onVisible = () => { if (document.visibilityState === "visible") refreshAvailability(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [flightInventoryManaged, product, productRef]);

  // Selector metadata has its own endpoint and lifecycle. A failed/invalid
  // quote must not leave the customization controls permanently loading.
  useEffect(() => {
    if (product !== "trevista" || !productData) return;
    const tourRooms = Array.isArray(productData.hotelOptions) && productData.hotelOptions.length
      ? productData.hotelOptions.filter((option) => option.active !== false).map((option) => ({
          value: String(option._id || option.id || option.title),
          label: option.title || option.label,
          desc: option.description || option.desc || "",
          price: Number(option.pricing?.amountMinor || 0) / 100,
        }))
      : customizationMasterOptions["trevista.defaultRoomOptions"];
    const transportOptions = customizationMasterOptions["trevista.transportOptions"];
    if (Array.isArray(tourRooms) || Array.isArray(transportOptions)) {
      setCustomizeOptions((current) => ({
        roomOptions: Array.isArray(tourRooms) ? tourRooms : current.roomOptions,
        transportOptions: Array.isArray(transportOptions) ? transportOptions : current.transportOptions,
      }));
    }
  }, [customizationMasterOptions, product, productData]);

  // A hotel selected from Trevista's detail-page modal is represented by the
  // same roomType field used by server-side pricing and the booking record.
  useEffect(() => {
    if (product !== "trevista" || !productData || !initialRoomType) return;
    flow.updateTrip("roomType", initialRoomType);
  }, [flow.updateTrip, initialRoomType, product, productData]);

  // The base hotel included with a Trevista package is the default room
  // selection. A hotel explicitly chosen on the details page always wins.
  useEffect(() => {
    if (product !== "trevista" || initialRoomType || flow.trip.roomType) return;
    const includedRoom = customizeOptions.roomOptions?.find((option) => Number(option.price || 0) === 0);
    if (includedRoom?.value) flow.updateTrip("roomType", includedRoom.value);
  }, [customizeOptions.roomOptions, flow.trip.roomType, flow.updateTrip, initialRoomType, product]);

  const seatsAvailable = product === "trevista" && !flightInventoryManaged ? null : availability?.seatsAvailable;
  const totalSeats = availability?.totalSeats;
  const isSoldOut = product === "trevio" && Boolean(availability?.isSoldOut);
  const isLowSeats = product === "trevio" && Boolean(availability?.isLowSeats);
  const guestsExceedSeats = Boolean(serverPricing?.availability?.canBook === false);
  const availabilityValidationMessage = serverPricing?.availability?.validationMessage || (flightInventoryManaged && seatsAvailable != null ? `Only ${seatsAvailable} flight seats are available` : "");

  useEffect(() => {
    if (prevStepRef.current !== flow.currentStep) {
      prevStepRef.current = flow.currentStep;
      scrollTargetsToTop("smooth");
    }
  }, [flow.currentStep]);

  const handleSubmit = async () => {
    if (guestsExceedSeats) {
      flow.setErrors({ submit: availabilityValidationMessage });
      return;
    }
    if (!userSession?.isAuthenticated) {
      onRequireAuth?.({ returnTo: window.location.href, reason: "create-booking" });
      return;
    }
    try {
      const selectedAddons = addons.filter((addon) => addon.selected);
      const payload = {
        product,
        startDate: flow.trip.startDate,
        endDate: flow.trip.endDate,
        adults: flow.trip.adults,
        children: flow.trip.children,
        infants: flow.trip.infants,
        roomType: flow.trip.roomType,
        travellers: flow.travellers,
        contact: flow.contact,
        preferences: {
          roomSharingPreference: flow.trip.roomType,
          ...(product === "trevista" ? {
            mealPreference: flow.trip.mealPreference,
            bedPreference: flow.trip.bedPreference,
            transport: flow.trip.transport,
            pickupCity: flow.trip.departureCity,
            addFlights: flow.trip.addFlights,
            passportReminder: flow.trip.passportReminder,
            visaAssistance: flow.trip.visaAssistance,
            notes: flow.trip.notes,
            extraActivities: selectedAddons.map((addon) => addon.name),
          } : {}),
        },
        ...(product === "trevista" ? {
          quoteId: activeQuoteId,
          pickupCity: flow.trip.departureCity,
          specialRequirements: flow.trip.notes,
        } : {}),
        addons: selectedAddons,
        couponCode: couponCode.trim(),
        idempotencyKey: bookingAttemptKeyRef.current,
        guestSessionId: guestSessionIdRef.current,
      };

      if (product === "trevio") {
        payload.tripRef = productRef;
      } else {
        payload.tourRef = productRef;
      }

      const booking = await api.createBooking(payload);
      const bookingId = booking?.id || booking?._id || booking?.bookingId;
      if (!bookingId) throw new Error("No booking ID returned");

      const submitted = await api.submitBooking(bookingId);
      const confirmedData = submitted || { id: bookingId, product };
      setBookingConfirmed(confirmedData);
      persistConfirmation(product, productRef, confirmedData);
      clearResumeKey(bookingKey(product, productRef));
    } catch (err) {
      flow.setErrors({ submit: err.message });
    }
  };

  const handleNext = useCallback(() => {
    if (guestsExceedSeats) {
      flow.setErrors({ adults: availabilityValidationMessage });
      scrollToFirstError();
      return;
    }
    if (flow.stepKey === "review") {
      handleSubmit();
    } else {
      const advanced = flow.goNext();
      if (!advanced) scrollToFirstError();
    }
  }, [flow.stepKey, flow.goNext, guestsExceedSeats, seatsAvailable, addons, serverPricing]);

  const handleBack = useCallback(() => {
    flow.setErrors((prev) => {
      const next = { ...prev };
      delete next.submit;
      return next;
    });
    flow.goBack();
  }, [flow.goBack, flow.setErrors]);

  const isLastStep = flow.stepKey === "review";
  const nextLabel = isLastStep ? "Create Booking" : "Continue";

  const fabActions = useMemo(() => [
    ...(!flow.currentStep ? [] : [{ label: "Back", variant: "outline", align: "left", onClick: handleBack }]),
    {
      label: api.loading ? "Processing..." : nextLabel,
      variant: "primary",
      align: "right",
      onClick: handleNext,
      disabled: api.loading || (isSoldOut && product === "trevio") || (product === "trevista" && !activeQuoteId),
    },
  ], [flow.currentStep, handleBack, handleNext, nextLabel, api.loading, isSoldOut, product, activeQuoteId]);

  if (initialLoading || !flowReady) return <GlobalLoader visible text="Loading..." />;

  if (bookingConfirmed) {
    const handleGoToDashboard = () => {
      clearConfirmation(product, productRef);
      requestShellNavigation("bookings");
    };
    return (
      <BookingLayout steps={flow.steps} currentStep={flow.steps.length - 1} product={product} floatingBar={null} onExit={handleExit}>
        <BookingConfirmation
          booking={bookingConfirmed}
          product={product}
          onGoToDashboard={handleGoToDashboard}
        />
      </BookingLayout>
    );
  }

  if (loadError || !productData) {
    return (
      <BookingLayout steps={[]} currentStep={0} product={product} floatingBar={null} onExit={handleExit}>
        <div className="be-step">
          <EmptyState
            icon="alertTriangle"
            title="Unable to load trip"
            description={loadError || "The trip you're looking for could not be found or is no longer available."}
            action={
              <button type="button" className="be-empty__btn" onClick={handleExit}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                Go back
              </button>
            }
          />
        </div>
      </BookingLayout>
    );
  }

  const computedPricing = serverPricing;

  const handleAddonToggle = (addonId, selected) => {
    const nextAddons = addons.map((addon) =>
      (addon.id || addon.code || addon.name) === addonId
        ? { ...addon, selected: addon.included ? true : selected }
        : addon,
    );
    setAddons(nextAddons);
  };

  const sidebar = (
    <BookingSidebar
      product={product}
      productData={productData}
      trip={flow.trip}
      travellers={flow.travellers}
      guestsCount={flow.guestsCount}
      availability={availability}
      computedPricing={computedPricing}
      couponCode={couponCode}
      couponStatus={couponStatus}
      onCouponChange={(value) => {
        setCouponCode(value);
        setCouponStatus(null);
      }}
      onApplyCoupon={() => refreshPricing({ nextCouponCode: couponCode, showCouponResult: true, force: true })}
    />
  );

  if (isSoldOut) {
    return (
      <BookingLayout
        steps={flow.steps}
        currentStep={flow.currentStep}
        product={product}
        sidebar={sidebar}
        floatingBar={null}
        onExit={handleExit}
      >
        <SpotsFullView productData={productData} totalSeats={totalSeats} onExit={handleExit} />
      </BookingLayout>
    );
  }

  const stepComponent = {
    details: (
      <div className="be-details-step">
        <div className="be-details-step__trip">
          <TripStep
            tour={productData}
            trip={flow.trip}
            updateTrip={flow.updateTrip}
            errors={flow.errors}
            isFirst={flow.currentStep === 0}
            product={product}
            seatsAvailable={seatsAvailable}
            isLowSeats={isLowSeats}
            availabilityMessage={availability?.availabilityMessage}
            pricing={computedPricing}
          />
        </div>
        <div className="be-details-step__travellers">
          <TravellerStep
            travellers={flow.travellers}
            contact={flow.contact}
            updateTraveller={flow.updateTraveller}
            updateContact={flow.updateContact}
            errors={flow.errors}
            TRAVELLER_FIELDS={flow.TRAVELLER_FIELDS}
            TRAVELLER_PREFERENCE_FIELDS={flow.TRAVELLER_PREFERENCE_FIELDS}
            trip={flow.trip}
            productData={productData}
            updateTrip={flow.updateTrip}
            product={product}
          />
        </div>
      </div>
    ),
    trip: (
      <TripStep
        tour={productData}
        trip={flow.trip}
        updateTrip={flow.updateTrip}
        errors={flow.errors}
        isFirst={flow.currentStep === 0}
        product={product}
        seatsAvailable={seatsAvailable}
        isLowSeats={isLowSeats}
        availabilityMessage={availability?.availabilityMessage}
        pricing={computedPricing}
      />
    ),
    departure: (
      <DepartureStep
        tour={productData}
        trip={flow.trip}
        updateTrip={flow.updateTrip}
        errors={flow.errors}
        availability={availability}
        travellerTypes={customizationMasterOptions["booking.travellerTypeOptions"]}
        optionsError={customizationOptionsError}
      />
    ),
    customize: (
      <CustomizeStep
        trip={flow.trip}
        updateTrip={flow.updateTrip}
        errors={flow.errors}
        addons={addons}
        currency={computedPricing?.currency || "INR"}
        onToggleAddon={handleAddonToggle}
        roomOptions={customizeOptions.roomOptions}
        transportOptions={customizeOptions.transportOptions}
        optionsError={customizationOptionsError}
      />
    ),
    travellers: (
      <TravellerStep
        travellers={flow.travellers}
        contact={flow.contact}
        updateTraveller={flow.updateTraveller}
        updateContact={flow.updateContact}
        errors={flow.errors}
        TRAVELLER_FIELDS={flow.TRAVELLER_FIELDS}
        TRAVELLER_PREFERENCE_FIELDS={flow.TRAVELLER_PREFERENCE_FIELDS}
        trip={flow.trip}
        productData={productData}
        updateTrip={flow.updateTrip}
        product={product}
      />
    ),
    addons: (
      <AddOnsStep
        addons={addons}
        currency={computedPricing?.currency || "INR"}
        onToggle={handleAddonToggle}
      />
    ),
    review: (
      <ReviewStep
        tour={productData}
        trip={flow.trip}
        travellers={flow.travellers}
        contact={flow.contact}
        pricing={computedPricing}
        product={product}
        addons={addons}
        onEdit={(section) => {
          const targetStep = product === "trevio"
            ? { trip: 0, contact: 1, travellers: 1, addons: 2 }[section]
            : { departure: 0, customize: 1, trip: 0, addons: 1, contact: 2, travellers: 2 }[section];
          flow.goToStep(targetStep ?? 0);
        }}
      />
    ),
    checkout: (
      <CheckoutStep
        booking={bookingConfirmed}
        product={product}
        loading={api.loading}
      />
    ),
  };

  const seatWarning = guestsExceedSeats
    ? availabilityValidationMessage
    : isLowSeats
      ? availability?.availabilityMessage
      : availabilityNotice || null;

  const floatingBar = (
    <FloatingActionBar
      variant="floating"
      showBg
      align="stretch"
      gap="medium"
      error={flow.errors.submit || seatWarning}
      actions={fabActions}
      className="be-booking-fab"
    />
  );

  return (
    <BookingLayout
      steps={flow.steps}
      currentStep={flow.currentStep}
      product={product}
      sidebar={sidebar}
      floatingBar={floatingBar}
      onExit={handleExit}
    >
      {stepComponent[flow.stepKey] || (
        <div className="be-step">
          <EmptyState
            icon="alertCircle"
            title="Something went wrong"
            description={`Step "${flow.stepKey}" could not be loaded. Please try again.`}
            action={
              <button type="button" className="be-empty__btn" onClick={handleBack}>
                Go back
              </button>
            }
          />
        </div>
      )}
    </BookingLayout>
  );
}
