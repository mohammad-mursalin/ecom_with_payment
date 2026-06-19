// src/axios.jsx
import axios from 'axios';
import { getAccessToken, setAccessToken, clearTokens } from './authStorage';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Always send cookies — required for HttpOnly refresh cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────────────────────
// Attach the access token to every outgoing request when one exists in memory.
API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────────────────────
// On 401: attempt one silent token refresh, then retry the original request.
// Uses a queue to handle multiple simultaneous 401s without triggering multiple
// refresh calls.

let isRefreshing = false;
let failedQueue = []; // Requests that arrived while a refresh was already in progress

// After refresh completes, resolve or reject every queued request.
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response, // Pass through all successful responses unchanged

  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 Unauthorized. All other errors pass through.
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // If this request was already a retry (i.e., the refresh itself returned 401),
    // do not retry again — that would cause an infinite loop.
    if (originalRequest._isRetry) {
      processQueue(error, null);
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request and wait.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return API(originalRequest);
      }).catch((err) => Promise.reject(err));
    }

    // First 401 — start the refresh process.
    originalRequest._isRetry = true;
    isRefreshing = true;

    try {
      // Call refresh directly with axios (not API) to avoid the interceptor
      // running on the refresh call itself.
      // Send no body — the backend reads the HttpOnly cookie automatically.
      // withCredentials ensures the cookie is included.
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        {}, // Empty body — backend reads HttpOnly cookie, not body
        { withCredentials: true }
      );

      // Response: { success: true, data: { accessToken, refreshToken, user } }
      // We only need the accessToken here — ignore refreshToken (stays in HttpOnly cookie).
      const { accessToken } = response.data.data;

      setAccessToken(accessToken);

      // Update the failed original request and drain the queue.
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      processQueue(null, accessToken);

      return API(originalRequest);
    } catch (refreshError) {
      // Refresh failed — session is truly expired or invalid.
      processQueue(refreshError, null);
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;