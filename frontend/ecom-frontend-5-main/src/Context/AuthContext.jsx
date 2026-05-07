import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const roleArray = decoded.roles || [];
        const role = roleArray.length > 0 ? roleArray[0].replace("ROLE_", "") : (decoded.role || "USER");
        setUser({
          userId: decoded.userId,
          email: decoded.sub,
          role: role
        });
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
    // Optionally auto-login or redirect to login
    return response;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
