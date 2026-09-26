export const ROUTES = {
  auth: "/auth",
  login: "/login",
  home: "/",
  tours: "/tours",
};

export const getTourListPath = () => ROUTES.tours;

const normalizeTourRef = (tourRef) => {
  if (!tourRef) return "";
  if (typeof tourRef === "string" || typeof tourRef === "number") {
    const ref = String(tourRef).trim();
    const decoded = (() => {
      try {
        return decodeURIComponent(ref);
      } catch {
        return ref;
      }
    })();
    return decoded === "[object Object]" ? "" : ref;
  }
  if (typeof tourRef === "object") {
    return normalizeTourRef(
      tourRef.slug ||
        tourRef.tourRef ||
        tourRef.value ||
        tourRef.label ||
        tourRef.name ||
        tourRef.title ||
        tourRef.en ||
        tourRef.default ||
        tourRef._id ||
        tourRef.id,
    );
  }
  return "";
};

export const getTourDetailsPath = (tourRef) =>
  `${ROUTES.tours}/${encodeURIComponent(normalizeTourRef(tourRef))}`;
