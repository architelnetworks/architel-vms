#!/usr/bin/env python3
"""Promote an existing local VMS account without changing its password.

Run with the backend stopped. Host access to its database is required; this is
an explicit provisioning operation, not a remote authentication bypass.
"""

import argparse
import sqlite3
from datetime import UTC, datetime
from pathlib import Path


def main() -> None:
    """Back up the database and promote the named, existing account."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--username", required=True)
    args = parser.parse_args()
    database = args.database.resolve(strict=True)
    with sqlite3.connect(str(database)) as connection:
        user = connection.execute(
            'SELECT role, password_hash FROM "user" WHERE username = ?',
            (args.username,),
        ).fetchone()
        if user is None or not user[1]:
            parser.error("The account must already exist and have a password")
        if user[0] == "superadmin":
            print("Account already has the superadmin role")
            return
        stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
        backup = database.with_name(f"{database.stem}-before-superadmin-{stamp}.db")
        with sqlite3.connect(str(backup)) as destination:
            connection.backup(destination)
        connection.execute(
            'UPDATE "user" SET role = ? WHERE username = ?',
            ("superadmin", args.username),
        )
    print(f"Promoted {args.username} to superadmin; password preserved")
    print(f"Database backup: {backup}")


if __name__ == "__main__":
    main()
