import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage/session";
import bookingReducer from "./bookingSlice.js";

const STORAGE_KEY = "tt-booking-engine";

// Only persist the booking form fields — not transient UI state
const bookingPersistConfig = {
  key: "booking",
  storage,
  whitelist: ["currentStep", "product", "trip", "travellers", "contact"],
};

const rootReducer = combineReducers({
  booking: persistReducer(bookingPersistConfig, bookingReducer),
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/FLUSH", "persist/PAUSE", "persist/PERSIST", "persist/PURGE", "persist/REGISTER"],
      },
    }),
});

const persistor = persistStore(store);

export { store, persistor };
