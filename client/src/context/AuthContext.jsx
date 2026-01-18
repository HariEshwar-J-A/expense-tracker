import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure axios to always send cookies
    axios.defaults.withCredentials = true;

    const checkSession = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const updateUser = async (updates) => {
    try {
      const res = await axios.put("/api/auth/profile", updates);
      if (res.data.user) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (error) {
      console.error("Update profile error", error);
      return { success: false, error: error.response?.data?.message || "Error updating profile" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
