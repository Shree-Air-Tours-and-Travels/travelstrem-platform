import apiService from "./apiService";

export const authService = {
    getConfig: () => apiService.get("/auth/config"),
    login: (payload) => apiService.post("/auth/login", payload, { headers: { "Content-Type": "application/json" } }),
    register: (payload) => apiService.post("/auth/register", payload, { headers: { "Content-Type": "application/json" } }),
    logout: () => apiService.post("/auth/logout"),
};

export default authService;
