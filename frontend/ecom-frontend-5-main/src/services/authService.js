// src/services/authService.js
// All auth API calls. Every function uses the custom API instance from axios.jsx.
// Every function returns response.data (the full ApiResponse object).
// Callers read .data from the result to get the actual payload.
//
// Example: const result = await login(email, pass)
//          result.data.accessToken  ← the JWT
//          result.data.user         ← { id, username, email, role }

import API from '../axios';

/**
 * Login.
 * Returns: { success, data: { accessToken, refreshToken, user }, message }
 * Side effect (backend): sets HttpOnly refreshToken cookie.
 */
export const login = (email, password, rememberMe = false) =>
  API.post('/auth/login', { email, password, rememberMe }).then((r) => r.data);

/**
 * Register.
 * Returns: { success, data: { accessToken, refreshToken, user }, message }
 * Side effect (backend): sets HttpOnly refreshToken cookie (same as login).
 */
export const register = (username, email, password, confirmPassword) =>
  API.post('/auth/register', { username, email, password, confirmPassword }).then((r) => r.data);

/**
 * Logout.
 * Returns: { success, data, message }
 * Side effect (backend): deletes DB refresh token, clears HttpOnly cookie.
 * No body needed. No auth required (backend fixed to always return 200).
 */
export const logout = () =>
  API.post('/auth/logout').then((r) => r.data);

/**
 * Get the authenticated user's full profile.
 * Requires a valid access token in memory (attached by the request interceptor).
 * Returns: { success, data: { userId, email, username, fullName, phoneNumber, ... } }
 */
export const getProfile = () =>
  API.get('/auth/profile').then((r) => r.data);

/**
 * Update the authenticated user's profile.
 * Returns: { success, data: { ...updated user... }, message }
 */
export const updateProfile = (profileData) =>
  API.put('/auth/profile', profileData).then((r) => r.data);

/**
 * Change password.
 * Returns: { success, data, message }
 */
export const changePassword = (currentPassword, newPassword, confirmNewPassword) =>
  API.put('/auth/password', { currentPassword, newPassword, confirmNewPassword }).then((r) => r.data);

/**
 * Check if a username is already taken.
 * Returns: { success, data: true (available) | false (taken) }
 */
export const checkUsername = (username) =>
  API.get('/auth/check-username', { params: { username } }).then((r) => r.data);

/**
 * Check if an email is already registered.
 * Returns: { success, data: true (available) | false (taken) }
 */
export const checkEmail = (email) =>
  API.get('/auth/check-email', { params: { email } }).then((r) => r.data);

/**
 * Delete account.
 * Returns: { success, data, message }
 */
export const deleteAccount = (username) =>
  API.delete('/auth/me', { data: { username } }).then((r) => r.data);