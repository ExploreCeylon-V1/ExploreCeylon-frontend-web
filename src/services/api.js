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
    const existingAuth = typeof config.headers?.get === "function"
      ? config.headers.get("Authorization")
      : config.headers?.Authorization;

    if (!existingAuth) {
      const token = getToken();
      if (token) {
        if (typeof config.headers?.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          config.headers = { Authorization: `Bearer ${token}` };
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency Subscriber Queue for 401 Retries
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Access tokens are short-lived (15 min); a plain axios call (not apiClient) avoids
// re-entering these interceptors. Concurrent 401s share one in-flight refresh call.
let refreshPromise = null;
export function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error("No refresh token"));

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/api/v1/auth/refresh-token`, { refreshToken })
      .then((res) => {
        updateAccessToken(res.data.accessToken, res.data.refreshToken);
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
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retried = true;
            if (typeof originalRequest.headers?.set === "function") {
              originalRequest.headers.set("Authorization", `Bearer ${token}`);
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              originalRequest.headers.authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retried = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);
        if (typeof originalRequest.headers?.set === "function") {
          originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        }
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.authorization = `Bearer ${newAccessToken}`;
        } else {
          originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` };
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuth();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
          // Suppress promise rejection propagation while the page is navigating away
          // so React components do not render flash error states like "Failed to load trips".
          return new Promise(() => {});
        }
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;