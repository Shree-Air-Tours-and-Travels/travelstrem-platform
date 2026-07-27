import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchData, useComponentData, validateFields } from "@packages/trem-utils";
import BookingPageView from "../view/BookingPage.view";
import { getDateInputValue, emptyTraveler, readStoredUser } from "../helper";

const bookingFields = {
  trip: {
    startDate: { name: "startDate", type: "date", required: true, messages: { required: "Start date is required" } },
    endDate: { name: "endDate", type: "date", required: true, messages: { required: "End date is required" } },
    guests: { name: "guests", type: "number", required: true, min: 1, integer: true, messages: { min: "Add at least one guest" } },
  },
  contact: {
    contactEmail: { name: "contactEmail", type: "email", required: true, messages: { required: "Contact email is required" } },
    contactPhone: { name: "contactPhone", type: "tel", required: true, messages: { required: "Contact phone is required" } },
  },
  traveler: {
    firstName: { name: "firstName", type: "text", required: true, minLength: 2, messages: { required: "First name is required" } },
    lastName: { name: "lastName", type: "text", required: true, messages: { required: "Last name is required" } },
    email: { name: "email", type: "email", required: true, messages: { required: "Traveler email is required" } },
    phone: { name: "phone", type: "tel", required: true, messages: { required: "Traveler phone is required" } },
    age: { name: "age", type: "number", required: true, min: 1, max: 120, integer: true, messages: { required: "Age is required" } },
    passport: { name: "passport", type: "text", required: true, minLength: 5, maxLength: 20, pattern: "^[A-Za-z0-9]{5,20}$", messages: { required: "Passport / ID is required", pattern: "Passport must be 5\u201320 alphanumeric characters" } },
    nationality: { name: "nationality", type: "text", required: true, messages: { required: "Nationality is required" } },
    passportExpiryDate: { name: "passportExpiryDate", type: "text", required: true, minLength: 5, pattern: "^\\d{2}/\\d{2}$", messages: { required: "Passport expiry is required", pattern: "Use MM/YY format" } },
    emergencyContactName: { name: "emergencyContactName", type: "text", required: true, messages: { required: "Emergency contact is required" } },
    emergencyContactNumber: { name: "emergencyContactNumber", type: "tel", required: true, messages: { required: "Emergency phone is required" } },
  },
};

export default function BookingPageContainer() {
  const { tourRef } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const decodedRef = decodeURIComponent(String(tourRef || ""));
  const { loading: pageLoading, error: pageError, elements, config, dataScope } = useComponentData("/booking-page.json", { auto: true });
  const pageLabels = elements?.labels || {};
  const options = dataScope?.options || {};
  const maxGuests = config?.maxGuests || 10;

    const [tour, setTour] = useState(location.state?.tour || null);
    const referrer = useMemo(() => location.state?.from || { label: "Trevista", path: "/trevista" }, [location.state?.from]);
  const [tourLoading, setTourLoading] = useState(!tour);
  const [tourError, setTourError] = useState(null);
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pricePreview, setPricePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const user = useMemo(() => readStoredUser(), []);
  const defaultStart = getDateInputValue(tour?.startDate);
  const defaultEnd = getDateInputValue(tour?.endDate);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const guests = adults + children + infants;
  const [travelers, setTravelers] = useState([emptyTraveler()]);
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || user?.mobile || "");
  const [packageType, setPackageType] = useState("");
  const [mealPreference, setMealPreference] = useState("");

  useEffect(() => {
    if (tour) return;
    if (!decodedRef) return;
    let cancelled = false;
    (async () => {
      setTourLoading(true);
      try {
        const res = await fetchData(`/tours.json/${encodeURIComponent(decodedRef)}`);
        if (cancelled) return;
        if (res?.status === "success") {
          const data = res.componentData?.data || res.component?.data || res.data || {};
          setTour(data.tour || data);
        } else {
          setTourError(res?.message || "Tour not found");
        }
      } catch (err) {
        if (!cancelled) setTourError(err?.message || "Failed to load tour");
      } finally {
        if (!cancelled) setTourLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [decodedRef, tour]);

  useEffect(() => {
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  }, [defaultStart, defaultEnd]);

  useEffect(() => {
    if (!tour || step !== 1) return;
    const tourId = tour._id || tour.id;
    if (!tourId) return;
    let active = true;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetchData(`/tours.json/${encodeURIComponent(tourId)}`);
        if (!active) return;
        if (res?.status === "success") {
          const data = res.componentData?.data || res.component?.data || res.data || {};
          const updatedTour = data.tour || data;
          const newSeats = updatedTour?.availability?.seatsAvailable;
          const oldSeats = tour?.availability?.seatsAvailable;
          if (newSeats != null && newSeats !== oldSeats) {
            setTour((prev) => prev ? { ...prev, availability: { ...prev.availability, seatsAvailable: newSeats } } : prev);
          }
        }
      } catch {
        // polling failure is silent
      }
    }, 30000);
    return () => { active = false; clearInterval(intervalId); };
  }, [tour?._id, tour?.id, step]);

  useEffect(() => {
    const total = adults + children + infants;
    setTravelers((prev) => {
      const next = [...prev];
      while (next.length < total) next.push(emptyTraveler());
      while (next.length > total) next.pop();
      return next;
    });
  }, [adults, children, infants]);

  const pricePreviewFetched = useRef(false);

  useEffect(() => {
    const total = adults + children + infants;
    async function fetchPreview() {
      if (!tour || !startDate) return;
      try {
        const id = tour._id || tour.id || tour;
        const q = new URLSearchParams({ date: startDate, guests: String(total) });
        const res = await fetchData(`/tours.json/${id}/price?${q.toString()}`);
        if (res?.status === "success") {
          const data = res.componentData?.data;
          if (data?.priceSnapshot) setPricePreview(data.priceSnapshot);
          else if (data && (data.perPerson || data.total || data.min)) setPricePreview(data);
        }
      } catch {
        // price preview is optional
      }
    }
    if (pricePreviewFetched.current) {
      fetchPreview();
    } else {
      pricePreviewFetched.current = true;
    }
  }, [tour, startDate, adults, children, infants]);

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  }, []);

  const validateTripStep = useCallback(() => {
    const total = adults + children + infants;
    const nextErrors = { ...validateFields({ startDate, endDate, guests: total }, bookingFields.trip).errors };
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!nextErrors.startDate && !nextErrors.endDate && start > end) {
      nextErrors.startDate = "Start date must be before end date";
      nextErrors.endDate = "End date must be after start date";
    }
    if (total < 1) nextErrors.guests = "Add at least one traveler";
    if (tour?.availability?.seatsAvailable != null) {
      const seats = Number(tour.availability.seatsAvailable);
      if (Number.isFinite(seats) && total > seats) nextErrors.guests = `Only ${seats} seats left for this tour`;
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [startDate, endDate, adults, children, infants, tour]);

  const validateTravelerStep = useCallback(() => {
    const nextErrors = { ...validateFields({ contactEmail, contactPhone }, bookingFields.contact).errors };
    travelers.forEach((traveler, index) => {
      const result = validateFields(traveler, bookingFields.traveler);
      Object.entries(result.errors).forEach(([field, message]) => {
        nextErrors[`travelers.${index}.${field}`] = message;
      });
    });
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [contactEmail, contactPhone, travelers]);

  const handleNext = useCallback(() => {
    if (step === 1 && !validateTripStep()) return;
    if (step === 2 && !validateTravelerStep()) return;
    setStep((s) => Math.min(3, s + 1));
  }, [step, validateTripStep, validateTravelerStep]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const handleGuestsChange = useCallback((type, value) => {
    const clamped = Math.max(type === "adults" ? 1 : 0, Math.min(maxGuests, Number(value) || 0));
    if (type === "adults") setAdults(clamped);
    else if (type === "children") setChildren(clamped);
    else if (type === "infants") setInfants(clamped);
    clearFieldError("guests");
  }, [maxGuests, clearFieldError]);

  const handleTravelerChange = useCallback((index, field, value) => {
    setTravelers((prev) => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
    clearFieldError(`travelers.${index}.${field}`);
  }, [clearFieldError]);

  const handleSubmit = useCallback(async () => {
    const tripOk = validateTripStep();
    const travelersOk = validateTravelerStep();
    if (!tripOk || !travelersOk) {
      setStep(tripOk ? 2 : 1);
      return;
    }

    const tourId = tour?._id || tour?.id;
    if (tourId && user?.id) {
      try {
        const check = await fetchData(`/bookings/check?tourId=${tourId}&userId=${user.id}`);
        if (check?.status === "success" && check?.componentData?.hasActive) {
          setFieldErrors({ _general: "You already have a pending booking for this tour. Please wait for agent confirmation before booking again." });
          setSubmitting(false);
          return;
        }
      } catch {
        // backend check unavailable , proceed anyway
      }
    }

    setSubmitting(true);
    try {
      const total = adults + children + infants;
      const payload = {
        tourId: tour._id || tour.id,
        startDate,
        endDate,
        guests: total,
        adults,
        children,
        infants,
        travelers: travelers.map((traveler) => ({
          firstName: traveler.firstName.trim(),
          lastName: traveler.lastName.trim(),
          email: traveler.email.trim() || contactEmail.trim(),
          phone: traveler.phone.trim() || contactPhone.trim(),
          age: traveler.age,
          travellerType: traveler.travellerType,
          title: traveler.title,
          middleName: traveler.middleName,
          gender: traveler.gender,
          dob: traveler.dob,
          nationality: traveler.nationality,
          countryOfResidence: traveler.countryOfResidence,
          passportNumber: traveler.passport || "",
          passportIssueCountry: traveler.passportIssueCountry,
          passportExpiryDate: traveler.passportExpiryDate,
          emergencyContactName: traveler.emergencyContactName,
          emergencyContactRelation: traveler.emergencyContactRelation,
          emergencyContactNumber: traveler.emergencyContactNumber,
          dietaryPreferences: traveler.dietaryPreferences,
          medicalConditions: traveler.medicalConditions,
          wheelchairRequired: traveler.wheelchairRequired,
          visaStatus: traveler.visaStatus,
        })),
        contact: {
          name: user?.name || `${travelers[0]?.firstName || ""} ${travelers[0]?.lastName || ""}`.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
        },
        adultCount: adults,
        childCount: children,
        infantCount: infants,
        roomType: packageType || "",
        pickupCity: "",
        mealPreference: mealPreference || "",
        specialRequests: "",
        termsAccepted: true,
        cancellationPolicyAccepted: true,
        user: user ? { id: user._id || user.id, name: user.name, email: user.email, phone: user.phone } : undefined,
      };

      const res = await fetchData("/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      if (res?.status !== "success") {
        const serverErrors = res?.componentData?.config?.validation?.errors;
        if (serverErrors && Object.keys(serverErrors).length) {
          const mappedErrors = Object.entries(serverErrors).reduce((acc, [key, value]) => {
            acc[key.replace(/\.passportNumber$/, ".passport")] = value;
            return acc;
          }, {});
          setFieldErrors(mappedErrors);
        }
        throw new Error(res?.message || "Booking failed");
      }

      const booking = res.componentData?.data;
      if (!booking) throw new Error("Booking created but no booking data returned.");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFieldErrors((prev) => ({ ...prev, _general: err.message || "Failed to create booking" }));
    } finally {
      setSubmitting(false);
    }
  }, [tour, startDate, endDate, adults, children, infants, travelers, contactEmail, contactPhone, user, validateTripStep, validateTravelerStep, navigate]);

  const loading = pageLoading || tourLoading;
  const error = pageError || tourError;
  const showGeneralError = fieldErrors._general;

  return (
    <BookingPageView
      loading={loading}
      error={error}
      pageLabels={pageLabels}
      options={options}
      step={step}
      tour={tour}
      startDate={startDate}
      endDate={endDate}
      guests={guests}
      adults={adults}
      children={children}
      infants={infants}
      maxGuests={maxGuests}
      travelers={travelers}
      contactEmail={contactEmail}
      contactPhone={contactPhone}
      fieldErrors={showGeneralError ? { ...fieldErrors } : fieldErrors}
      pricePreview={pricePreview}
      submitting={submitting}
      breadcrumbItems={[
        ...(referrer.path !== "/trevista"
          ? [referrer, { label: "Trevista", path: "/trevista" }]
          : [referrer]
        ),
        ...(tour?.title ? [{ label: tour.title }] : []),
        { label: "Book" },
      ]}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onGuestsChange={handleGuestsChange}
      onPackageTypeChange={setPackageType}
      onMealPreferenceChange={setMealPreference}
      onContactEmailChange={setContactEmail}
      onContactPhoneChange={setContactPhone}
      onTravelerChange={handleTravelerChange}
      onClearError={clearFieldError}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      onGoBack={() => navigate(referrer.path)}
    />
  );
}
