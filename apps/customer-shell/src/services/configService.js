import apiService from "./apiService";

const readComponentData = async (path, params = {}) => {
    const data = await apiService.get(path, { params });
    return data.componentData || data;
};

export const getHeaderConfig = (params) => readComponentData("/header-config", params);

// Retained for CMS/admin previews and direct diagnostics. The runtime init path now reads pageConfig from /session.
export const getPageConfig = (params) => readComponentData("/page-config", params);
