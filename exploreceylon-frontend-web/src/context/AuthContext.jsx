import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const TRAVELER_TOKEN_KEY = "ec_traveler_token";
const TRAVELER_USER_KEY  = "ec_traveler_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem(TRAVELER_TOKEN_KEY);
    const u = localStorage.getItem(TRAVELER_USER_KEY);
    
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch { 
        // JSON error aawoth corrupted data auto clean kireema
        localStorage.removeItem(TRAVELER_TOKEN_KEY);
        localStorage.removeItem(TRAVELER_USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);

    // Save only the essential traveler keys
    localStorage.setItem(TRAVELER_TOKEN_KEY, newToken);
    localStorage.setItem(TRAVELER_USER_KEY, JSON.stringify(newUser));
  };

  const logout = (redirectTo = "/login") => {
    // Clean only the specific keys
    localStorage.removeItem(TRAVELER_TOKEN_KEY);
    localStorage.removeItem(TRAVELER_USER_KEY);

    setToken(null);
    setUser(null);
    navigate(redirectTo);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}