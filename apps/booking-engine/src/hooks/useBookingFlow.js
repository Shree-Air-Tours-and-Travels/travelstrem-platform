import { useCallback, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setCurrentStep,
  setTripField,
  setTrip,
  setTravellerField,
  setTravellers,
  setContactField,
  setContact,
  setErrors,
  clearErrors,
  resetBooking,
  setProduct,
  hydrateFromProduct,
  TRAVELLER_FIELDS,
  TRAVELLER_PREFERENCE_FIELDS,
  STEP_CONFIG,
} from "../store/bookingSlice.js";

const DOMESTIC_NATIONALITIES = new Set(["India"]);

function validateTraveller(traveller, allTravellers = [], preferenceFields = []) {
  const errors = {};
  TRAVELLER_FIELDS.filter((f) => f.required).forEach((f) => {
    if (f.name === "passportNumber") {
      const isInternational = allTravellers.some((t) => {
        const nat = (t.nationality || "").toLowerCase();
        return nat && !DOMESTIC_NATIONALITIES.has(nat);
      });
      if (isInternational && !String(traveller[f.name] || "").trim()) {
        errors[f.name] = "Passport number is required for international travel";
      }
      return;
    }
    if (f.name === "emergencyContact") return;
    if (!String(traveller[f.name] || "").trim()) errors[f.name] = `${f.label} is required`;
  });
  preferenceFields.forEach((field) => {
    if (field.required && !String(traveller[field.name] || "").trim()) {
      errors[field.name] = `${field.label} is required`;
    }
  });
  if (traveller.email && !/^\S+@\S+\.\S+$/.test(traveller.email)) errors.email = "Invalid email";
  return errors;
}

function validateTrip(trip, roomRequired = true) {
  const errors = {};
  if (!trip.startDate) errors.startDate = "Start date is required";
  if (!trip.endDate) errors.endDate = "End date is required";
  if (trip.startDate && trip.endDate && new Date(trip.startDate) >= new Date(trip.endDate)) {
    errors.endDate = "End date must be after start date";
  }
  if (!trip.adults || trip.adults < 1) errors.adults = "At least 1 adult required";
  if (roomRequired && !String(trip.roomType || "").trim()) errors.roomType = "Room type is required";
  return errors;
}

function validateContact(contact) {
  const errors = {};
  if (!contact.name?.trim()) errors.name = "Name is required";
  if (!contact.email?.trim()) errors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(contact.email)) errors.email = "Invalid email";
  if (!contact.phone?.trim()) errors.phone = "Phone is required";
  return errors;
}

export function useBookingFlow({ product: productProp = "trevista", tour = null } = {}) {
  const dispatch = useDispatch();
  const booking = useSelector((state) => state.booking);

  const { currentStep, trip, travellers, contact, errors, product: storedProduct } = booking;
  const product = productProp || storedProduct;

  const steps = useMemo(() => STEP_CONFIG[product] || STEP_CONFIG.trevista, [product]);
  const stepKey = steps[currentStep]?.key;
  const activePreferenceFields = useMemo(
    () => TRAVELLER_PREFERENCE_FIELDS.filter(
      (field) => Array.isArray(tour?.preferences?.[field.optionsKey])
        && tour.preferences[field.optionsKey].length > 0,
    ),
    [tour],
  );
  const roomRequired = product !== "trevio"
    || (Array.isArray(tour?.preferences?.roomTypes) && tour.preferences.roomTypes.length > 0);

  // Sync product to store if prop changes
  useEffect(() => {
    if (productProp && productProp !== storedProduct) {
      dispatch(setProduct(productProp));
    }
  }, [productProp, storedProduct, dispatch]);

  // Hydrate trip dates from product data (for trevio)
  useEffect(() => {
    if (product !== "trevio" || !tour) return;
    dispatch(hydrateFromProduct(tour));
  }, [product, tour?.slug, dispatch]);

  const updateTrip = useCallback((field, value) => {
    dispatch(setTripField({ field, value }));
  }, [dispatch]);

  const updateTraveller = useCallback((index, field, value) => {
    dispatch(setTravellerField({ index, field, value }));
  }, [dispatch]);

  const updateContact = useCallback((field, value) => {
    dispatch(setContactField({ field, value }));
  }, [dispatch]);

  const validateCurrentStep = useCallback(() => {
    let stepErrors = {};

    if (stepKey === "trip") {
      stepErrors = validateTrip(trip, roomRequired);
    } else if (stepKey === "travellers") {
      travellers.forEach((t, i) => {
        const tErrors = validateTraveller(t, travellers, activePreferenceFields);
        Object.entries(tErrors).forEach(([k, v]) => { stepErrors[`travellers.${i}.${k}`] = v; });
      });
      const cErrors = validateContact(contact);
      Object.entries(cErrors).forEach(([k, v]) => { stepErrors[`contact.${k}`] = v; });
    } else if (stepKey === "details" || stepKey === "review") {
      stepErrors = { ...validateTrip(trip, roomRequired), ...validateContact(contact) };
      travellers.forEach((t, i) => {
        const tErrors = validateTraveller(t, travellers, activePreferenceFields);
        Object.entries(tErrors).forEach(([k, v]) => { stepErrors[`travellers.${i}.${k}`] = v; });
      });
    }

    dispatch(setErrors(stepErrors));
    return Object.keys(stepErrors).length === 0;
  }, [stepKey, trip, travellers, contact, activePreferenceFields, roomRequired, dispatch]);

  const goNext = useCallback(() => {
    if (!validateCurrentStep()) return false;
    dispatch(setCurrentStep(Math.min(steps.length - 1, currentStep + 1)));
    return true;
  }, [validateCurrentStep, steps.length, currentStep, dispatch]);

  const goBack = useCallback(() => {
    dispatch(setCurrentStep(Math.max(0, currentStep - 1)));
  }, [currentStep, dispatch]);

  const goToStep = useCallback((index) => {
    if (index <= currentStep) dispatch(setCurrentStep(index));
  }, [currentStep, dispatch]);

  const guestsCount = useMemo(() =>
    Number(trip.adults || 1) + Number(trip.children || 0) + Number(trip.infants || 0),
    [trip.adults, trip.children, trip.infants]
  );

  return {
    steps,
    currentStep,
    stepKey,
    trip,
    travellers,
    contact,
    errors,
    guestsCount,
    updateTrip,
    updateTraveller,
    updateContact,
    goNext,
    goBack,
    goToStep,
    setErrors: (updater) => dispatch(setErrors(updater)),
    setTravellers: (list) => dispatch(setTravellers(list)),
    setContact: (obj) => dispatch(setContact(obj)),
    setTrip: (obj) => dispatch(setTrip(obj)),
    resetBooking: () => dispatch(resetBooking()),
    TRAVELLER_FIELDS,
    TRAVELLER_PREFERENCE_FIELDS,
  };
}
