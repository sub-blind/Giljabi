"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { LoginDialog } from "@/components/auth/LoginDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}<LoginDialog /></AuthProvider>;
}
