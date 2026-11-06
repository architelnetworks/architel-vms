This is the Architel VMS frontend which connects to and provides a User Interface to the Python backend.

# Web Development

## Installing Web Dependencies Via NPM

Within `/web`, run:

```bash
npm install
```

## Running development frontend

Within `/web`, run:

```bash
PROXY_HOST=<ip_address:port> npm run dev
```

The Proxy Host can point to your existing Frigate instance. Otherwise defaults to
`127.0.0.1:5000` if running Frigate on the same machine. Using IPv4 explicitly
avoids connecting to macOS AirPlay's IPv6 listener on port 5000.

## Local Architel backend (Docker Desktop)

From the repository root, create `config/config.yml` with no cameras initially:

```yaml
mqtt:
  enabled: false
cameras: {}
```

Then start the backend from this checkout:

```bash
make version
docker compose -f docker-compose.dev.yml up -d --build
```

The initial build downloads and compiles Frigate's dependencies. The backend
is available at `http://localhost:5000`, bound only to the local machine.
Configuration and database files persist in `config/`, and recordings in `debug/`.

In another terminal, start the frontend:

```bash
cd web
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite (normally `http://localhost:5173`). Saving frontend
files triggers live updates. Python source and migrations are mounted from this
checkout; after backend edits, run:

```bash
docker compose -f docker-compose.dev.yml restart backend
```

After dependency or Dockerfile changes, rerun the build command. To view logs or
stop the backend without deleting local data:

```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml down
```

## Extensions
Install these IDE extensions for an improved development experience:
- eslint
