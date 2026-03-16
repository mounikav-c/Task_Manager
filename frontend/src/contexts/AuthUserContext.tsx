import { createContext, useContext, type ReactNode } from "react";
import type { AuthSession } from "@/lib/api";

type AuthUser = AuthSession["user"];

interface AuthUserContextValue {
  user: AuthUser;
  onLogout: () => void;
}

const AuthUserContext = createContext<AuthUserContextValue>({
  user: null,
  onLogout: () => {},
});

interface AuthUserProviderProps {
  user: AuthUser;
  onLogout: () => void;
  children: ReactNode;
}

export function AuthUserProvider({ user, onLogout, children }: AuthUserProviderProps) {
  return <AuthUserContext.Provider value={{ user, onLogout }}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthUserContext);
}
