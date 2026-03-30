import { createContext, useContext, type ReactNode } from "react";
import type { AuthSession } from "@/lib/api";

type AuthUser = AuthSession["user"];
type Department = AuthSession["departments"][number];

interface AuthUserContextValue {
  user: AuthUser;
  departments: Department[];
  selectedDepartmentId: number | null;
  canEditSelectedDepartment: boolean;
  onSelectDepartment: (departmentId: number) => void;
  onLogout: () => void;
}

const AuthUserContext = createContext<AuthUserContextValue>({
  user: null,
  departments: [],
  selectedDepartmentId: null,
  canEditSelectedDepartment: true,
  onSelectDepartment: () => {},
  onLogout: () => {},
});

interface AuthUserProviderProps {
  user: AuthUser;
  departments: Department[];
  selectedDepartmentId: number | null;
  canEditSelectedDepartment: boolean;
  onSelectDepartment: (departmentId: number) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function AuthUserProvider({
  user,
  departments,
  selectedDepartmentId,
  canEditSelectedDepartment,
  onSelectDepartment,
  onLogout,
  children,
}: AuthUserProviderProps) {
  return (
    <AuthUserContext.Provider
      value={{ user, departments, selectedDepartmentId, canEditSelectedDepartment, onSelectDepartment, onLogout }}
    >
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser() {
  return useContext(AuthUserContext);
}
