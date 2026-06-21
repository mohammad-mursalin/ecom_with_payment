// src/Context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../axios';
import { setAccessToken, clearTokens } from '../authStorage';
import * as authService from '../services/authService';
import { performRefresh } from '../refreshCoordinator';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until session restore completes

  // ─── SESSION RESTORE ───────────────────────────────────────────────────────
  // Runs once on every page mount (including F5 reload).
  // Memory is always empty on mount — the access token must be recovered via refresh.
  // The browser automatically sends the HttpOnly cookie with the refresh request.
  // No body is sent — the backend reads the cookie.
useEffect(() => {
    const restoreSession = async () => {
      try {
        const { accessToken, user: minimalUser } = await performRefresh();

        setAccessToken(accessToken);

        setUser(minimalUser);

        try {
          const profileResponse = await API.get('/auth/profile');
          setUser(profileResponse.data.data);
        } catch {
          // Keep the minimal user object — profile fetch is best-effort
        }

      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

    // ─── LOGIN ─────────────────────────────────────────────────────────────────
    // Stores the access token in memory and sets the user state.
    // Does NOT redirect — the calling component handles redirect.
    // Throws on error — caller must wrap in try/catch.
    const login = useCallback(async (email, password) => {
      const response = await authService.login(email, password);
      const { accessToken, user: minimalUser } = response.data;

      setAccessToken(accessToken);
      setUser(minimalUser);

      try {
        const profileResponse = await authService.getProfile();
        setUser(profileResponse.data);
      } catch {
        // Non-fatal
      }
    }, []);

    // ─── REGISTER ──────────────────────────────────────────────────────────────
  // Identical flow to login — register now also sets the HttpOnly cookie (backend fixed).
  // Auto-logs the user in. Does NOT redirect — caller handles redirect.
  // Throws on error — caller must wrap in try/catch.
  const register = useCallback(async (username, email, password, confirmPassword) => {
    const response = await authService.register(username, email, password, confirmPassword);

    const { accessToken, user: minimalUser } = response.data;

    setAccessToken(accessToken);
    setUser(minimalUser);

    // Fetch full profile in the background
    try {
      const profileResponse = await authService.getProfile();
      setUser(profileResponse.data);
    } catch {
      // Non-fatal
    }
  }, []);

  // ─── LOGOUT ────────────────────────────────────────────────────────────────
  // Calls the backend to delete the refresh token from the DB and clear the cookie.
  // Backend logout no longer requires authentication — it always returns 200.
  // clearTokens() clears the in-memory access token.
  // Redirects to home using window.location (not useNavigate — context wraps the router).
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Silent — even if the network call fails, we still clear locally
    } finally {
      clearTokens();   // Clear in-memory access token
      setUser(null);
      window.location.href = '/'; // Hard redirect — clears all React state
    }
  }, []);

  // ─── UPDATE PROFILE ───────────────────────────────────────────────────────
  const updateProfile = useCallback(async (profileData) => {
    const response = await authService.updateProfile(profileData);
    setUser((prev) => ({ ...prev, ...response.data }));
    return response;
  }, []);

  // ─── CHANGE PASSWORD ───────────────────────────────────────────────────────
  const changePassword = useCallback(
    (currentPassword, newPassword, confirmNewPassword) =>
      authService.changePassword(currentPassword, newPassword, confirmNewPassword),
    []
  );

  // ─── DERIVED STATE ─────────────────────────────────────────────────────────
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  // Render children unconditionally. Individual pages and RequireAuth
  // handle the loading state — the provider does not block rendering.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};