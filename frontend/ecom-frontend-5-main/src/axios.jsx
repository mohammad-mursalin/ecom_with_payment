import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authStorage';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,  // send cookies on every request (needed for refresh token cookie)
});

// ── Request interceptor ───────────────────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────

// Public endpoints — 401 from these is normal for guest users, never redirect
const PUBLIC_ENDPOINTS = [
  '/categories',
  '/brands',
  '/products',
  '/product/',
  '/shipping/estimate',
  '/coupons/validate',
  '/auth/check-username',
  '/auth/check-email',
];

// Concurrent refresh queue — if multiple requests fail with 401 simultaneously,
// only one refresh call is made; the rest wait and retry with the new token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Not a 401 — pass through, let the calling code handle it
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // The refresh endpoint itself returned 401 — don't retry, just clear and redirect
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearAccessToken();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Public endpoint returned 401 (guest user) — normal, don't redirect
    const isPublic = PUBLIC_ENDPOINTS.some(path =>
      originalRequest.url?.includes(path)
    );
    if (isPublic) {
      return Promise.reject(error);
    }

    if (originalRequest._isGuestCheck) {
      return Promise.reject(error);
    }

    // Already retried once and still got 401 — token is genuinely invalid
    if (originalRequest._retry) {
      clearAccessToken();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Another refresh is already in flight — queue this request to retry after
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
          return API(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Attempt token refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await API.post('/auth/refresh', {}, {
        withCredentials: true,  // ensure refresh token cookie is sent
        _retry: true,           // prevent this call itself from being intercepted
      });

      // Backend wraps responses as { success, data: { accessToken, ... } }
      const newToken = response.data?.data?.accessToken;

      if (!newToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      setAccessToken(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      processQueue(null);
      return API(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError);
      clearAccessToken();
      window.location.href = '/login';
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default API;