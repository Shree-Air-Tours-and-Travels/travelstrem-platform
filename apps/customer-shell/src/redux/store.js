// src/store/index.js (example)
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
// import other reducers

const store = configureStore({
  reducer: {
    auth: authReducer,
    // ...other reducers
  },
});

export default store;
