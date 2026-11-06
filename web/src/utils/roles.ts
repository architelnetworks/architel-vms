/** Site administration privileges inherited by the engineering role. */
export const isAdminRole = (role: string | null | undefined): boolean =>
  role === "admin" || role === "superadmin";
