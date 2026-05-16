export const ROUTES = {
  auth: "/auth",
  login: "/login",
  home: "/",
  tours: "/tours",
};

export const getTourListPath = () => ROUTES.tours;

export const getTourDetailsPath = (tourRef) =>
  `${ROUTES.tours}/${encodeURIComponent(String(tourRef))}`;
