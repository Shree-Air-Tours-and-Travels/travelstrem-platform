import { fetchData } from "@packages/trem-utils";

const WIDGET_ENDPOINT = "/featured-holiday-packages.json";
const PAGE_KEY = "tours-remote/home";

export const fetchFeaturedHolidayPackages = async () => {
  const res = await fetchData(`${WIDGET_ENDPOINT}?pageKey=${PAGE_KEY}`);
  const component = res?.component || {};
  return {
    packages: component.data?.packages || [],
    labels: component.elements?.labels || {},
    config: component.structure?.widgets?.[0]?.props || {},
  };
};
