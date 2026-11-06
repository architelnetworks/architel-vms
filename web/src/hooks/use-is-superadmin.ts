import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

export function useIsSuperAdmin(): boolean {
  const { auth } = useContext(AuthContext);
  return auth.isAuthenticated && auth.user?.role === "superadmin";
}
