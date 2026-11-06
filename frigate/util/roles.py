"""Built-in Architel application role permissions."""

ADMIN_ROLES = frozenset({"admin", "superadmin"})


def is_admin_role(role: str | None) -> bool:
    """Return whether a role includes site administration permissions."""
    return role in ADMIN_ROLES
