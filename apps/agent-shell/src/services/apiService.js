import api from "./apiClient";

const unwrap = (response) => response?.data;

export const apiService = {
    get: (url, config = {}) => api.get(url, config).then(unwrap),
    post: (url, data = {}, config = {}) => api.post(url, data, config).then(unwrap),
    put: (url, data = {}, config = {}) => api.put(url, data, config).then(unwrap),
    patch: (url, data = {}, config = {}) => api.patch(url, data, config).then(unwrap),
    del: (url, config = {}) => api.delete(url, config).then(unwrap),
};

export default apiService;
