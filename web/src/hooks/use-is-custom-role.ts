import { isAdminRole } from "@/utils/roles";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

export function useIsCustomRole() {
  const { auth } = useContext(AuthContext);
  return !(
    isAdminRole(auth.user?.role) ||
    auth.user?.role == "viewer" ||
    !auth.isAuthenticated
  );
}
