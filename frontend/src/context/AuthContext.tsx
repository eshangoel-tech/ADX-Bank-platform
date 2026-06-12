"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, sessionId: string) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("adx_token");
    const storedSession = localStorage.getItem("adx_session_id");
    if (storedToken) setToken(storedToken);
    if (storedSession) setSessionId(storedSession);
    setLoading(false);
  }, []);

  const login = (newToken: string, newSessionId: string) => {
    setToken(newToken);
    setSessionId(newSessionId);
    localStorage.setItem("adx_token", newToken);
    localStorage.setItem("adx_session_id", newSessionId);
  };

  const logout = () => {
    setToken(null);
    setSessionId(null);
    localStorage.removeItem("adx_token");
    localStorage.removeItem("adx_session_id");
  };

  const getToken = () => token ?? localStorage.getItem("adx_token");

  return (
    <AuthContext.Provider
      value={{
        token,
        sessionId,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
