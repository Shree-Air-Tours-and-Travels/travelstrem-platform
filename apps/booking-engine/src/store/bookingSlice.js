import { createSlice } from "@reduxjs/toolkit";

const TRAVELLER_FIELDS = [
  { name: "title", label: "Title", type: "select", options: [{ value: "Mr", label: "Mr" }, { value: "Mrs", label: "Mrs" }, { value: "Ms", label: "Ms" }], required: true },
  { name: "firstName", label: "First Name", type: "text", required: true },
  { name: "lastName", label: "Last Name", type: "text", required: true },
  { name: "gender", label: "Gender", type: "select", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }], required: true },
  { name: "dob", label: "Date of Birth", type: "date", required: true },
  { name: "nationality", label: "Nationality", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true },
  { name: "passportNumber", label: "Passport Number", type: "text" },
  { name: "emergencyContact", label: "Emergency Contact", type: "tel" },
];

function emptyTraveller(index = 0) {
  const t = {};
  TRAVELLER_FIELDS.forEach((f) => { t[f.name] = f.defaultValue || ""; });
  t.title = index === 0 ? "Mr" : "Ms";
  return t;
}

const STEP_CONFIG = {
  trevio: [
    { key: "trip", label: "Trip Details" },
    { key: "travellers", label: "Travellers" },
    { key: "review", label: "Review" },
    { key: "checkout", label: "Payment" },
  ],
  trevista: [
    { key: "trip", label: "Trip Details" },
    { key: "travellers", label: "Travellers" },
    { key: "review", label: "Review & Submit" },
  ],
};

const initialState = {
  currentStep: 0,
  product: "trevista",
  trip: { startDate: "", endDate: "", adults: 2, children: 0, infants: 0, roomType: "double" },
  travellers: [emptyTraveller(0), emptyTraveller(1)],
  contact: { name: "", email: "", phone: "" },
  errors: {},
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setProduct(state, action) {
      state.product = action.payload;
    },

    setCurrentStep(state, action) {
      state.currentStep = action.payload;
    },

    setTripField(state, action) {
      const { field, value } = action.payload;
      state.trip[field] = value;

      if (field === "adults") {
        const count = Math.max(1, Number(value) || 1);
        while (state.travellers.length < count) {
          state.travellers.push(emptyTraveller(state.travellers.length));
        }
        if (state.travellers.length > count) {
          state.travellers = state.travellers.slice(0, count);
        }
      }

      if (state.errors[field]) {
        delete state.errors[field];
      }
    },

    setTrip(state, action) {
      state.trip = { ...state.trip, ...action.payload };
    },

    setTravellerField(state, action) {
      const { index, field, value } = action.payload;
      if (state.travellers[index]) {
        state.travellers[index][field] = value;
        const errorKey = `travellers.${index}.${field}`;
        if (state.errors[errorKey]) {
          delete state.errors[errorKey];
        }
      }
    },

    setTravellers(state, action) {
      state.travellers = action.payload;
    },

    setContactField(state, action) {
      const { field, value } = action.payload;
      state.contact[field] = value;
      const errorKey = `contact.${field}`;
      if (state.errors[errorKey]) {
        delete state.errors[errorKey];
      }
    },

    setContact(state, action) {
      state.contact = action.payload;
    },

    setErrors(state, action) {
      state.errors = typeof action.payload === "function"
        ? action.payload(state.errors)
        : action.payload;
    },

    clearErrors(state) {
      state.errors = {};
    },

    resetBooking() {
      return { ...initialState };
    },

    hydrateFromProduct(state, action) {
      const product = action.payload;
      if (!product) return;
      state.trip.startDate = product.startDateISO || state.trip.startDate;
      state.trip.endDate = product.endDateISO || state.trip.endDate;
      state.trip.pricePerPerson = product.price || state.trip.pricePerPerson;
      state.trip.tokenAmount = product.token || state.trip.tokenAmount;
    },
  },
});

export const {
  setProduct,
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
  hydrateFromProduct,
} = bookingSlice.actions;

export { TRAVELLER_FIELDS, STEP_CONFIG };

export default bookingSlice.reducer;
