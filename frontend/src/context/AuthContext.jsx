// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to persist auth data to localStorage and state
  const persistAuth = (userData, tokens) => {
    if (userData) {
      localStorage.setItem("estateiq_user", JSON.stringify(userData));
      setUser(userData);
    }
    if (tokens?.accessToken) {
      localStorage.setItem("estateiq_access_token", tokens.accessToken);
      setAccessToken(tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      localStorage.setItem("estateiq_refresh_token", tokens.refreshToken);
      setRefreshToken(tokens.refreshToken);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem("estateiq_user");
    localStorage.removeItem("estateiq_access_token");
    localStorage.removeItem("estateiq_refresh_token");
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const msg = response.data?.error?.message || "Login failed";
        throw new Error(msg);
      }
      const userData = response.data?.data?.user;
      const tokens = response.data?.data?.tokens;
      persistAuth(userData, tokens);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const msg = response.data?.error?.message || "Registration failed";
        throw new Error(msg);
      }
      const newUser = response.data?.data?.user;
      const tokens = response.data?.data?.tokens;
      persistAuth(newUser, tokens);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    // Attempt backend logout, ignore errors
    try {
      if (refreshToken) {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (_) {}
    clearAuth();
    navigate("/");
  };

  const refreshTokens = async () => {
    try {
      const storedRefresh = localStorage.getItem("estateiq_refresh_token");
      if (!storedRefresh) throw new Error("No refresh token");
      const response = await apiRequest("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });
      if (!response.ok) throw new Error("Refresh failed");
      const newTokens = response.data?.data?.tokens;
      persistAuth(null, newTokens); // only update tokens
      return true;
    } catch (e) {
      clearAuth();
      return false;
    }
  };

  const restoreAuth = async () => {
    const storedUser = localStorage.getItem("estateiq_user");
    const storedAccess = localStorage.getItem("estateiq_access_token");
    const storedRefresh = localStorage.getItem("estateiq_refresh_token");
    if (!storedAccess) {
      setLoading(false);
      return;
    }
    // Set initial state from storage
    setAccessToken(storedAccess);
    setRefreshToken(storedRefresh);
    setUser(storedUser ? JSON.parse(storedUser) : null);
    try {
      let response = await apiRequest("/auth/me", { method: "GET" });
      if (!response.ok) {
        // If token expired, try refresh
        const code = response.data?.error?.details?.code;
        if (code === "TOKEN_EXPIRED") {
          const refreshed = await refreshTokens();
          if (refreshed) {
            response = await apiRequest("/auth/me", { method: "GET" });
          }
        }
      }
      if (response.ok) {
        const freshUser = response.data?.data?.user;
        setUser(freshUser);
        localStorage.setItem("estateiq_user", JSON.stringify(freshUser));
      } else {
        clearAuth();
      }
    } catch (_) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Restore any persisted auth state on initial load
    restoreAuth();
    // Listen for global auth‑expiration events triggered by the API layer
    const handleAuthExpired = () => {
      clearAuth();
      navigate('/login');
    };
    window.addEventListener('estateiq-auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('estateiq-auth-expired', handleAuthExpired);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        error,
        login,
        register,
        logout,
        refreshTokens,
        restoreAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

