export const normalizeEnvironment = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    return raw === "production" || raw === "prod" ? "production" : "development";
};
