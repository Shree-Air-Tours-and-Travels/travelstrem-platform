import apiService from "./apiService";

const readComponentData = async (path, params = {}) => {
  try {
    const data = await apiService.get(path, { params });
    return data.componentData || data;
  } catch (err) {
    console.warn(
      `[configService] Failed to load ${path}:`,
      err?.response?.data?.message || err.message,
    );
    return {};
  }
};

export const getHeaderConfig = (params) => readComponentData("/header-config", params);
