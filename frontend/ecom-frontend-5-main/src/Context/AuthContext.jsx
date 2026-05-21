import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const response = await API.get("/auth/profile");
      const profile = response.data.data;
      setUser({
        userId: profile.userId,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        profilePictureUrl: profile.profilePictureUrl || "",
        bio: profile.bio || "",
      });
    } catch (err) {
      // If the user is not fully set up yet (e.g. just registered), tolerate 404
      console.warn("Profile fetch failed, using JWT data only:", err.message || err);
    }
  };

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const roleArray = decoded.roles || [];
        const role = roleArray.length > 0 ? roleArray[0].replace("ROLE_", "") : (decoded.role || "USER");
        setUser({
          userId: decoded.userId,
          email: decoded.sub,
          role: role,
          fullName: "",
          phoneNumber: "",
          address: "",
          profilePictureUrl: "",
          bio: "",
        });
        fetchProfile();
      } catch (err) {
        console.error("Failed to decode token", err);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const response = await API.post("/auth/login", { email, password });
    const { token, userId, email: userEmail, role } = response.data.data;
    localStorage.setItem("token", token);
    setToken(token);
    setUser({ userId, email: userEmail, role });
    return response;
  };

  const register = async (email, password, confirmPassword) => {
    const response = await API.post("/auth/register", { email, password, confirmPassword });
    return response;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const response = await API.put("/auth/profile", profileData);
    const profile = response.data.data;
    setUser(prev => ({ ...prev, ...profile }));
    return response;
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
    updateProfile,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
