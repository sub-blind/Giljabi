"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAuthSession, logoutAuthSession, refreshAuthSession, type AuthSession } from "@/lib/auth";

interface AuthContextValue extends AuthSession {
  ready: boolean;
  error: string;
  loginOpen: boolean;
  loginReturnTo: string;
  openLogin: (returnTo?: string) => void;
  closeLogin: () => void;
  reload: () => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const guest: AuthSession = { authenticated: false, hasRefreshToken: false, user: null };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>(guest);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginReturnTo, setLoginReturnTo] = useState("/");

  const reload = useCallback(async () => {
    let value = await getAuthSession();
    if (!value.authenticated && value.hasRefreshToken) {
      try {
        await refreshAuthSession();
        value = await getAuthSession();
      } catch {
        value = { ...value, hasRefreshToken: false };
      }
    }
    setSession(value);
    setReady(true);
    setError("");
    return value;
  }, []);

  useEffect(() => {
    void reload().catch(() => {
      setReady(true);
      setError("로그인 상태를 확인하지 못했어요. 여행 찾기는 계속 이용할 수 있어요.");
    });
  }, [reload]);

  const logout = useCallback(async () => {
    await logoutAuthSession();
    setSession(guest);
    setError("");
  }, []);

  const value = useMemo(() => ({ ...session, ready, error, loginOpen, loginReturnTo,
    openLogin: (returnTo = "/") => { setLoginReturnTo(returnTo); setLoginOpen(true); },
    closeLogin: () => setLoginOpen(false), reload, logout,
  }), [session, ready, error, loginOpen, loginReturnTo, reload, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider 안에서 사용해주세요.");
  return value;
}
