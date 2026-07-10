import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuth, getToken, getStoredUser, clearAuth, updateStoredUser } from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();

    if (t && u) {
      setToken(t);
      setUser(u);
    } else if (t || u) {
      // Only one half survived (corrupted/partial) — clear both.
      clearAuth();
    }
    setLoading(false);
  }, []);

  // remember === true  → persist across browser restarts (localStorage)
  // remember === false → session-only (cleared when the tab closes)
  const login = (newToken, newUser, remember = true, refreshToken = null) => {
    setToken(newToken);
    setUser(newUser);
    saveAuth(newToken, newUser, remember, refreshToken);
  };

  const logout = (redirectTo = "/login") => {
    clearAuth();
    setToken(null);
    setUser(null);
    navigate(redirectTo);
  };

  // Merge partial fields into the current user and persist to the active store.
  const updateUser = (partial) => {
    setUser((prev) => ({ ...(prev || {}), ...partial }));
    updateStoredUser(partial);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}