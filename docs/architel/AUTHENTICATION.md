# Local application roles

Architel VMS uses Frigate's existing local users, JWT sessions, camera permissions,
and proxy authentication. `User.role` is already a string, so the engineering
role requires no database migration. Existing accounts keep their roles.

- `superadmin`: engineering administration, including every site-admin capability.
- `admin`: existing site administration and management of ordinary accounts.
- `viewer` and custom camera roles: existing viewing and camera restrictions.

Use `useIsSuperAdmin()` for internal UI and `require_superadmin()` for its API
operations. UI visibility alone is not an authorization boundary. Anonymous
internal access still resolves to `admin`, never `superadmin`.

Admins cannot create, promote, demote, delete, or reset passwords of superadmin
accounts. Only superadmins can change authentication, proxy, and environment
settings through configuration writes. Site admins can still manage custom
camera roles. Reserved role names cannot be supplied as custom roles. The last
superadmin cannot be removed through user-management APIs. The built-in `admin`
account retains upstream deletion and role-change protections.

No additional settings have been hidden by this change. A future stage will
choose which engineering controls to restrict and enforce those restrictions
on their backend operations too. Operators with host/database access remain
trusted; this role does not sandbox the server from its host administrator.

## Provision an engineering account

Stop the relevant backend, then promote an existing password-bearing account:

```bash
docker compose -f dev/mock-cameras/compose.yml stop backend
python3 dev/provision-superadmin.py \
  --database dev/mock-cameras/.data/config/frigate.db --username admin
docker compose -f dev/mock-cameras/compose.yml up -d backend
```

The command makes a SQLite backup and preserves the password. It does not
create accounts or print credentials. Sign in again after provisioning. A
configured admin password reset preserves the account's existing role.

## Authenticated local development

The mock backend publishes only `127.0.0.1:8972`, mapped to the authenticated
container listener on port 8971. Its development configuration disables TLS
because traffic stays on the local machine. Authentication remains enabled.
The anonymous container port 5000 is not published to the host.

Set `web/.env.local` to:

```dotenv
PROXY_HOST=127.0.0.1:8972
PROXY_PROTOCOL=http
```

Start the mock backend and the frontend:

```bash
docker compose -f dev/mock-cameras/compose.yml up -d backend
cd web
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173` and sign in with the existing local account. Vite
serves the login HTML and proxies API, media, and WebSocket requests with the
session cookie. Restart Vite after changing proxy environment variables.

The normal `docker-compose.dev.yml` publishes authenticated port 8971 instead.
Its TLS-enabled backend uses `PROXY_PROTOCOL=https` (the Vite default).
The development proxy accepts the backend's self-signed certificate. Production
must retain its proper TLS and authenticated reverse-proxy configuration.


## Verification

The focused backend suite passed 270 tests covering authentication, user
management, configuration writes, media access, and WebSocket permissions.
Native login with a temporary verification account, session cookies, a
superadmin profile, admin API access, and a camera snapshot were checked on
the running mock backend. The temporary account was removed. Vite's login
entry point and anonymous API rejection were checked on port 5173. The
existing local account password was preserved.
