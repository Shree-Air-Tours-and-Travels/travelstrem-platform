export const ROUTES = {
  auth: "/auth",
  login: "/login",
  home: "/",
  packages: "/tours",
  shellTours: "/tours",
  legacyPackageTours: "/packages/tours",
};

export const getPackageListPath = () => ROUTES.packages;

export const getPackageTourDetailsPath = (tourId) =>
  `${ROUTES.packages}/${encodeURIComponent(String(tourId))}`;

export const getLegacyPackageTourDetailsPath = (tourId) =>
  `${ROUTES.legacyPackageTours}/${encodeURIComponent(String(tourId))}`;
