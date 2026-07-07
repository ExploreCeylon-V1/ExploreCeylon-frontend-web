import axios from 'axios';
import { getToken, getRefreshToken, updateAccessToken, clearAuth } from '../utils/authStorage';

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
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Access tokens are short-lived (15 min); a plain axios call (not apiClient) avoids
// re-entering these interceptors. Concurrent 401s share one in-flight refresh call.
let refreshPromise = null;
function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error("No refresh token"));

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/api/v1/auth/refresh-token`, { refreshToken })
      .then((res) => {
        updateAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// 2. Response Interceptor: on a 401, try a silent token refresh once before giving up.
//    - 403 (authenticated but forbidden for THIS resource) does NOT log the
//      user out — it isn't an expired session.
//    - The auth endpoints (login/register/google/refresh-token) surface their own
//      errors, so a 401 there must NOT trigger a silent-refresh loop or redirect.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config || {};
    const url = originalRequest.url || "";
    const isAuthEndpoint = url.includes("/api/v1/auth/");

    if (status === 401 && !isAuthEndpoint && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newAccessToken}` };
        return apiClient(originalRequest);
      } catch {
        clearAuth();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;