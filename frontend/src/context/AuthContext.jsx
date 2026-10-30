
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, { setAccessToken } from "../services/api";

const AuthContext = createContext(null);

// Prevent duplicate refresh requests during React StrictMode initialization.
let sessionRestorePromise = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore the session using the HttpOnly refresh cookie.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        if (!sessionRestorePromise) {
          sessionRestorePromise = (async () => {
            const refreshResponse = await api.post("/auth/refresh");

            const accessToken = refreshResponse.data?.token;

            if (!accessToken) {
              throw new Error("Access token was not returned.");
            }

            setAccessToken(accessToken);

            const profileResponse = await api.get("/auth/me");

            const restoredUser = profileResponse.data?.user;

            if (
              !restoredUser ||
              !restoredUser.username ||
              !restoredUser.role
            ) {
              throw new Error("Invalid user profile response.");
            }

            return {
              user: restoredUser,
              token: accessToken,
            };
          })().finally(() => {
            sessionRestorePromise = null;
          });
        }

        const session = await sessionRestorePromise;

        if (!cancelled) {
          setUser(session.user);
          setToken(session.token);
        }
      } catch (error) {
        setAccessToken(null);

        if (!cancelled) {
          setUser(null);
          setToken(null);
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

  // Clear the frontend session when automatic refresh fails.
  useEffect(() => {
    const handleSessionExpired = () => {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    };

    window.addEventListener(
      "crm:session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "crm:session-expired",
        handleSessionExpired
      );
    };
  }, []);

  // Login: keep the access token in memory only.
  const login = useCallback((userData, accessToken) => {
    setAccessToken(accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  // Logout: revoke the backend refresh session.
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
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
