import apiService from "./apiService";

export const authService = {
    getConfig: () => apiService.get("/auth/config"),
    requestAdminRegistrationOtp: (payload) => apiService.post("/auth/admin-registration-otp", payload, { headers: { "Content-Type": "application/json" } }),
    verifyAdminRegistrationOtp: (payload) => apiService.post("/auth/verify-admin-registration-otp", payload, { headers: { "Content-Type": "application/json" } }),
    login: (payload) => apiService.post("/auth/login", payload, { headers: { "Content-Type": "application/json" } }),
    register: (payload) => apiService.post("/auth/register", payload, { headers: { "Content-Type": "application/json" } }),
    logout: () => apiService.post("/auth/logout"),
    forgotPassword: (payload) => apiService.post("/auth/forgot-password", payload, { headers: { "Content-Type": "application/json" } }),
    resetPassword: (payload) => apiService.post("/auth/reset-password", payload, { headers: { "Content-Type": "application/json" } }),
    verifyLoginOtp: (payload) => apiService.post("/auth/verify-otp", payload, { headers: { "Content-Type": "application/json" } }),
    resendLoginOtp: (payload) => apiService.post("/auth/resend-otp", payload, { headers: { "Content-Type": "application/json" } }),
};

export default authService;
