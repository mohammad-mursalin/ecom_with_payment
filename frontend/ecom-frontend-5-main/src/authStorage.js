// src/authStorage.js
// Stores ONLY the access token in a module-level variable.
// The access token is intentionally lost on page reload — restoreSession() in
// AuthContext will recover it by calling POST /api/auth/refresh on every mount.
//
// The refresh token is NOT stored here. It lives in an HttpOnly cookie set by
// the backend. JavaScript never reads or writes it.
//
// NEVER use localStorage or sessionStorage for tokens anywhere in this project.

let _accessToken = null;

export const getAccessToken  = ()      => _accessToken;
export const setAccessToken  = (token) => { _accessToken = token; };
export const clearAccessToken = ()     => { _accessToken = null; };
export const hasAccessToken  = ()      => !!_accessToken;

// clearTokens is an alias for clearAccessToken.
// Named "clearTokens" so call sites read clearly — even though only one token
// lives here, the name signals "clear everything auth-related in memory".
export const clearTokens = () => { _accessToken = null; };