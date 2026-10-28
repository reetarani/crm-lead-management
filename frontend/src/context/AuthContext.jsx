
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    () => sessionStorage.getItem("crm_token")
  );

  const [isInitializing, setIsInitializing] = useState(true);

  // Restore the authenticated user when the application loads.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem("crm_token");

      if (!savedToken) {
        setToken(null);
        setUser(null);
        setIsInitializing(false);
        return;
      }

      setToken(savedToken);

      try {
        const response = await api.get("/auth/me");

        // Support common API response formats.
        const restoredUser =
          response.data?.user ??
          response.data?.data ??
          response.data;

        if (
          !restoredUser ||
          typeof restoredUser !== "object" ||
          !restoredUser.username ||
          !restoredUser.role
        ) {
          throw new Error("Invalid user profile response.");
        }

        if (!cancelled) {
          setUser(restoredUser);
          setToken(savedToken);
        }
      } catch {
        if (!cancelled) {
          // Invalid or expired token: clear the session.
          sessionStorage.removeItem("crm_token");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Login: receive the user first, then the token.
  const login = useCallback((userData, accessToken) => {
    sessionStorage.setItem("crm_token", accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  // Logout: clear the stored session.
  const logout = useCallback(() => {
    sessionStorage.removeItem("crm_token");
    setToken(null);
    setUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isInitializing,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, login, logout, isInitializing]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}
