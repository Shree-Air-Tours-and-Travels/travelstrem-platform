// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../utils/api";
import { jwtDecode } from "jwt-decode"; // named import (package exports jwtDecode)

/**
 * fetchCurrentUser - call server endpoint /auth/me to get authoritative user profile
 */
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");
      return res.data; // expecting { id, name, email, role }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to fetch user";
      const status = err?.response?.status || null;
      return rejectWithValue({ message: msg, status });
    }
  }
);

/**
 * initAuth - checks localStorage for token (prefers configured key),
 * sets Authorization header on api, tries to decode token for tentative info,
 * then fetches full user from server.
 */
export const initAuth = createAsyncThunk(
  "auth/init",
  async (_, { dispatch, rejectWithValue }) => {
    let token = null;
    try {
      const preferredKey = localStorage.getItem("auth_token_key_name");
      if (preferredKey) token = localStorage.getItem(preferredKey);
      if (!token) token = localStorage.getItem("token") || localStorage.getItem("auth_token") || null;
    } catch (e) {
      token = localStorage.getItem("token") || localStorage.getItem("auth_token") || null;
    }

    if (!token) return rejectWithValue("no-token");

    // set header immediately so fetchCurrentUser can use it
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // decode token for quick fallback
    let decoded = null;
    try {
      decoded = jwtDecode(token);
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      return rejectWithValue("invalid-token");
    }

    try {
      const serverUser = await dispatch(fetchCurrentUser()).unwrap();
      try { localStorage.setItem("auth_user", JSON.stringify(serverUser)); } catch (e) {}
      // ensure we remember which key we read token from
      try {
        const preferredKey = localStorage.getItem("auth_token_key_name") || "token";
        localStorage.setItem("auth_token_key_name", preferredKey);
      } catch (e) {}
      return { token, fromToken: decoded, serverUser };
    } catch (err) {
      const errMsg = err?.message || (typeof err === "string" ? err : "fetch-user-failed");
      const errStatus = err?.status || null;
      console.warn("[initAuth] fetchCurrentUser failed:", errMsg, "status:", errStatus);

      if (errStatus === 404 || (errMsg && errMsg.toLowerCase().includes("not found"))) {
        const fallbackUser = {
          id: decoded?.sub || decoded?.id || decoded?.userId || null,
          name: decoded?.name || null,
          email: decoded?.email || null,
          role: decoded?.role || "member",
        };
        if (fallbackUser.id) {
          try { localStorage.setItem("auth_user", JSON.stringify(fallbackUser)); } catch (e) {}
          return { token, fromToken: decoded, serverUser: fallbackUser };
        }
      }

      try { localStorage.removeItem("token"); } catch (e) {}
      try { localStorage.removeItem("auth_token"); } catch (e) {}
      delete api.defaults.headers.common["Authorization"];
      return rejectWithValue(errMsg || "fetch-user-failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: true,
    token: null,
    user: null,
    role: "public",
    error: null,
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      if (action.payload) {
        api.defaults.headers.common["Authorization"] = `Bearer ${action.payload}`;
        try {
          const storageKey = "token";
          localStorage.setItem(storageKey, action.payload);
          localStorage.setItem("auth_token_key_name", storageKey);
        } catch (e) {}
      } else {
        delete api.defaults.headers.common["Authorization"];
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("auth_token_key_name");
        } catch (e) {}
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.role = "public";
      state.loading = false;
      state.error = null;
      delete api.defaults.headers.common["Authorization"];
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token_key_name");
      } catch (e) {}
    },
    setUser(state, action) {
      state.user = action.payload;
      state.role = action.payload?.role || "member";
      try { if (action.payload) localStorage.setItem("auth_user", JSON.stringify(action.payload)); } catch (e) {}
    },
  },
  extraReducers(builder) {
    builder
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token || null;
        state.user = action.payload?.serverUser || action.payload?.fromToken || null;
        state.role = state.user?.role || "member";
        state.error = null;
      })
      .addCase(initAuth.rejected, (state, action) => {
        state.loading = false;
        state.token = null;
        state.user = null;
        state.role = "public";
        state.error = action.payload || action.error?.message || "init-failed";
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.role = action.payload?.role || "member";
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.role = "public";
        state.error = (action.payload && action.payload.message) || action.payload || action.error?.message || "fetch-user-failed";
      });
  },
});

export const { setToken, logout, setUser } = authSlice.actions;
export default authSlice.reducer;