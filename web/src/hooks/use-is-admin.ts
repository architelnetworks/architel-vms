import { isAdminRole } from "@/utils/roles";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

export function useIsAdmin() {
  const { auth } = useContext(AuthContext);
  const isAdmin =
    (auth.isAuthenticated && isAdminRole(auth.user?.role)) ||
    auth.user?.role === undefined;
  return isAdmin;
}
