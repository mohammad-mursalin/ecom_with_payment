import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, clearAccessToken } from "../authStorage";
import {
  login as loginService,
  register as registerService,
  getProfile,
  logout as logoutService,
  updateProfile as updateProfileService,
  changePassword as changePasswordService,
} from "../services/authService";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

const normaliseUser = (profile) => ({
  userId: profile.userId || profile.id,
  username: profile.username || "",
  email: profile.email,
  role: profile.role,
  fullName: profile.fullName || profile.username || "",
  phoneNumber: profile.phoneNumber || "",
  address: profile.address || "",
  profilePictureUrl: profile.profilePictureUrl || "",
  bio: profile.bio || "",
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Initial session restore ─────────────────────────────────────────────────
  // useRef so the effect dependency never changes — avoids StrictMode double-fire
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // StrictMode guard — only run once even in dev double-mount
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let cancelled = false;

    const initAuth = async () => {
      try {
        const profile = await getProfile({ _isGuestCheck: true });
        if (!cancelled) setUser(normaliseUser(profile));
      } catch (err) {
        // Ignore aborts (StrictMode unmount, fast navigation)
        // ERR_CANCELED = axios cancel, CanceledError = AbortController
        const isAbort =
          err?.code === "ERR_CANCELED" ||
          err?.name === "CanceledError" ||
          err?.name === "AbortError";

        if (isAbort) return; // not a real failure — do nothing, stay loading

        // Genuine failure (401, network error) — user is simply not logged in
        // Do NOT redirect here — being a guest on a public page is fine
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();

    return () => {
      cancelled = true; // cleanup — prevent state updates after unmount
    };
  }, []); // empty deps — runs once on mount only

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const data = await loginService(email, password);
    const { accessToken, user: userData } = data;
    setAccessToken(accessToken);
    setUser(normaliseUser(userData));
    return data;
  };

  // ── Register ────────────────────────────────────────────────────────────────
  const register = async (username, email, password, confirmPassword, fullName) => {
    const data = await registerService(username, email, password, confirmPassword, fullName);
    const { accessToken, user: userData } = data;
    setAccessToken(accessToken);
    setUser(normaliseUser({ ...userData, fullName: userData.fullName || fullName }));
    return data;
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await logoutService();
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Logout API failed:", err);
    }
    clearAccessToken();
    setUser(null);
    navigate("/");
  };

  // ── Profile update ──────────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    const profile = await updateProfileService(profileData);
    setUser((prev) => ({ ...prev, ...normaliseUser(profile) }));
    return profile;
  };

  // ── Password change ─────────────────────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    return await changePasswordService(currentPassword, newPassword, confirmNewPassword);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};