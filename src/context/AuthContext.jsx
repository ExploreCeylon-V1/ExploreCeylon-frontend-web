import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuth, getToken, getRefreshToken, getStoredUser, clearAuth, updateStoredUser } from "../utils/authStorage";
import { refreshAccessToken } from "../services/api";
import { AuthContext } from "../hooks/useAuth";

function isTokenExpiringSoon(tokenStr, bufferSeconds = 120) {
  if (!tokenStr) return true;
  try {
    const payload = JSON.parse(atob(tokenStr.split(".")[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return (exp - now) < bufferSeconds;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();

    if (t && u) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of auth state from storage on mount
      setToken(t);
      setUser(u);

      // If token is expiring within 2 minutes on mount, renew it immediately
      if (isTokenExpiringSoon(t) && getRefreshToken()) {
        refreshAccessToken()
          .then((newToken) => {
            if (newToken) setToken(newToken);
          })
          .catch(() => {});
      }
    } else if (t || u) {
      // Only one half survived (corrupted/partial) — clear both.
      clearAuth();
    }
    setLoading(false);
  }, []);

  // Proactive silent refresh: renew access token every 10 minutes (well before 15m expiration)
  useEffect(() => {
    if (!token) return;

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const interval = setInterval(() => {
      if (getRefreshToken()) {
        refreshAccessToken()
          .then((newToken) => {
            if (newToken) setToken(newToken);
          })
          .catch((err) => {
            console.warn("Silent token refresh failed:", err?.message || err);
          });
      }
    }, TEN_MINUTES_MS);

    return () => clearInterval(interval);
  }, [token]);

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