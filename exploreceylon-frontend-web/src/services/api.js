import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Axios instance eka hadaganna
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Hama API call ekakatama token eka auto add kireema
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ec_traveler_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Token eka expire unoth (401/403) auto logout kireema
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token eka expire wela nam, local storage eka clean karala login page ekata yawanna
      localStorage.removeItem("ec_traveler_token");
      localStorage.removeItem("ec_traveler_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;