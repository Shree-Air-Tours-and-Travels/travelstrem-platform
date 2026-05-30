import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchData, useComponentData, validateFields } from "@packages/trem-utils";
import BookingPageView from "../booking/view/BookingPage.view";
import { getDateInputValue, emptyTraveler, readStoredUser } from "../booking/helper";

export default function BookingPageContainer({ dispatchEvent } = {}) {
  const { tourRef } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const decodedRef = decodeURIComponent(String(tourRef || ""));
  const { loading: pageLoading, error: pageError, elements, config, dataScope } = useComponentData("/booking-page.json", { auto: true });
  const pageLabels = elements?.labels || {};
  const options = dataScope?.options || {};
  const maxGuests = config?.maxGuests || 10;

  const bookingFields = useMemo(() => ({
    trip: {
      startDate: { name: "startDate", type: "date", required: true, messages: { required: pageLabels.requiredStartDate || "Start date is required" } },
      endDate: { name: "endDate", type: "date", required: true, messages: { required: pageLabels.requiredEndDate || "End date is required" } },
      guests: { name: "guests", type: "number", required: true, min: 1, integer: true, messages: { min: pageLabels.addAtLeastOneGuest || "Add at least one guest" } },
    },
    contact: {
      contactEmail: { name: "contactEmail", type: "email", required: true, messages: { required: pageLabels.requiredContactEmail || "Contact email is required" } },
      contactPhone: { name: "contactPhone", type: "tel", required: true, messages: { required: pageLabels.requiredContactPhone || "Contact phone is required" } },
    },
    traveler: {
      firstName: { name: "firstName", type: "text", required: true, minLength: 2, messages: { required: pageLabels.requiredFirstName || "First name is required" } },
      lastName: { name: "lastName", type: "text", required: true, messages: { required: pageLabels.requiredLastName || "Last name is required" } },
      email: { name: "email", type: "email", required: true, messages: { required: pageLabels.requiredTravelerEmail || "Traveler email is required" } },
      phone: { name: "phone", type: "tel", required: true, messages: { required: pageLabels.requiredTravelerPhone || "Traveler phone is required" } },
      age: { name: "age", type: "number", required: true, min: 1, max: 120, integer: true, messages: { required: pageLabels.requiredAge || "Age is required" } },
      passport: { name: "passport", type: "text", required: true, minLength: 5, maxLength: 20, pattern: "^[A-Za-z0-9]{5,20}$", messages: { required: pageLabels.requiredPassport || "Passport / ID is required", pattern: pageLabels.passportPattern || "Passport must be 5\u201320 alphanumeric characters" } },
      nationality: { name: "nationality", type: "text", required: true, messages: { required: pageLabels.requiredNationality || "Nationality is required" } },
      passportExpiryDate: { name: "passportExpiryDate", type: "text", required: true, minLength: 5, pattern: "^\\d{2}/\\d{2}$", messages: { required: pageLabels.requiredPassportExpiry || "Passport expiry is required", pattern: pageLabels.passportExpiryPattern || "Use MM/YY format" } },
      emergencyContactName: { name: "emergencyContactName", type: "text", required: true, messages: { required: pageLabels.requiredEmergencyName || "Emergency contact is required" } },
      emergencyContactNumber: { name: "emergencyContactNumber", type: "tel", required: true, messages: { required: pageLabels.requiredEmergencyPhone || "Emergency phone is required" } },
    },
  }), [pageLabels]);

    const [tour, setTour] = useState(location.state?.tour || null);
    const referrer = useMemo(() => location.state?.from || { label: pageLabels.tours || "Tours", path: "/tours" }, [location.state?.from, pageLabels]);
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
    const total = adults + children + infants;
    setTravelers((prev) => {
      const next = [...prev];
      while (next.length < total) next.push(emptyTraveler());
      while (next.length > total) next.pop();
      return next;
    });
  }, [adults, children, infants]);

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
    fetchPreview();
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
      nextErrors.startDate = pageLabels.startBeforeEnd || "Start date must be before end date";
      nextErrors.endDate = pageLabels.endAfterStart || "End date must be after start date";
    }
    if (total < 1) nextErrors.guests = pageLabels.addAtLeastOne || "Add at least one traveler";
    if (tour?.availability?.seatsAvailable != null) {
      const seats = Number(tour.availability.seatsAvailable);
      if (Number.isFinite(seats) && total > seats) nextErrors.guests = (pageLabels.onlySeatsLeft || "Only {seats} seats left for this tour").replace("{seats}", seats);
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [startDate, endDate, adults, children, infants, tour, pageLabels]);

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
          setFieldErrors({ _general: pageLabels.pendingBookingError || "You already have a pending booking for this tour. Please wait for agent confirmation before booking again." });
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
        roomType: "",
        pickupCity: "",
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
        throw new Error(res?.message || pageLabels.bookingFailed || "Booking failed");
      }

      const booking = res.componentData?.data;
      if (!booking) throw new Error(pageLabels.bookingNoData || "Booking created but no booking data returned.");

      const bookingId = booking.id || booking._id;
      const state = {
        showDashboardPrompt: true,
        from: { label: pageLabels.dashboard || "Dashboard", path: "/dashboard", activeNav: "tours" },
      };
      if (typeof dispatchEvent === "function") {
        dispatchEvent("navigateToBookingSummary", { bookingId, replace: true, state });
      } else {
        navigate(`/tours/bookings/${bookingId}`, { replace: true, state });
      }
    } catch (err) {
      setFieldErrors((prev) => ({ ...prev, _general: err.message || pageLabels.createBookingFailed || "Failed to create booking" }));
    } finally {
      setSubmitting(false);
    }
  }, [tour, startDate, endDate, adults, children, infants, travelers, contactEmail, contactPhone, user, validateTripStep, validateTravelerStep, dispatchEvent, navigate, pageLabels]);

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
        ...(referrer.path !== "/tours"
          ? [referrer, { label: pageLabels.tours || "Tours", path: "/tours" }]
          : [referrer]
        ),
        ...(tour?.title ? [{ label: tour.title }] : []),
        { label: pageLabels.book || "Book" },
      ]}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onGuestsChange={handleGuestsChange}
      onContactEmailChange={setContactEmail}
      onContactPhoneChange={setContactPhone}
      onTravelerChange={handleTravelerChange}
      onClearError={clearFieldError}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      onGoBack={() => {
        if (typeof dispatchEvent === "function") dispatchEvent("navigateToTours", { path: referrer.path });
        else navigate(referrer.path);
      }}
    />
  );
}
