import { fetchData } from "@packages/trem-utils";

export const fetchTourSearch = async (search, signal) => {
  const response = await fetchData("/tours/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: search,
    signal,
  });
  if (response.status !== "success")
    throw new Error(response.message || "Tours could not be loaded");
  return response.data || response.component?.data || response;
};
