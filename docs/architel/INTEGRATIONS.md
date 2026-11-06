# Architel VMS integrations

Updated 2026-11-06. This document separates existing integration surfaces from
proposed contracts. See [Architecture](ARCHITECTURE.md) for source evidence and
[Decisions](DECISIONS.md) for unresolved choices.

## Existing surfaces

| Surface | What exists | Limits and intended reuse |
| --- | --- | --- |
| ONVIF | Host-specific device/media/PTZ probing, stream candidates, PTZ and autotracking in `frigate/api/camera.py` and `frigate/ptz/` | Reuse for Hikvision pilots. No network-wide WS-Discovery workflow identified; camera capabilities vary |
| RTSP/FFmpeg/go2rtc | Configured camera inputs, restreams, main/sub/detect/audio roles, browser streaming and probe diagnostics | Primary video ingest path. Verify direct camera accessibility, NVR channel URLs, credentials, codecs and camera session limits at the site |
| HTTP API | FastAPI routes behind nginx, auth/media/camera checks, generated `docs/static/frigate-api.yaml` | Extend route modules and dependencies; regenerate spec after endpoint/auth changes |
| WebSocket | Runtime state/commands, origin/auth checks, per-camera outbound filtering, bounded client queues | Browser interaction, not durable event delivery. New outbound topics must be classified in `frigate/comms/ws.py` or they are dropped |
| MQTT | Optional broker, configurable topic prefix, state/events/commands/availability, TLS/QoS and reconnect state replay | Preserve existing/Home Assistant consumers. Broker ACLs matter because command topics can control recording/settings/PTZ. No durable ACS outbox contract exists |
| Home Assistant | Existing documented integration and MQTT conventions | Optional consumer; essential VMS functionality must not require Home Assistant |
| Proxy authentication | Configurable trusted proxy headers, roles and JWT/native auth paths | Potential federation boundary. Not an implemented ACS SSO/client integration; prevent header spoofing by network/proxy design |
| Metrics/logs/notices | Prometheus, stats/history, service logs and persisted notices | Reuse for local monitoring and adapter status; source notices are not a custody/audit ledger |
| Notifications/GenAI/Frigate+ | WebPush, external/local provider options, model acquisition and optional Plus paths | Optional only. WebPush/cloud services and uncached model downloads cannot be assumed available offline |

## Ownership boundary

VMS owns camera configuration and stream credentials, recording policy, video
analytics, review metadata, playback, exports, and video-event history. ACS owns
access-control identity, access permissions/credentials, door/security alarm
state, and the authoritative audit history of those operations. VMS maintains
its own local application security and audit of video actions. Do not copy door
control, alarm acknowledgment authority, or credential management into VMS.

ACS may present authorized links to video near a door/alarm event. VMS may send
references to video-specific events for correlation. A VMS detection must not
automatically become an authoritative intrusion alarm without an explicit,
reviewed rule in the owning platform. VMS must not require ACS connectivity to
continue recording, playback, or independent emergency administration.

No ACS, Hikvision access-control, or Protege WX adapter was found in backend,
frontend, or migrations. Camera ONVIF support does not imply support for those
access/intrusion interfaces. Protocols, availability, API versions and permissions
must be confirmed from authorized equipment/system specifications before coding.

## Proposed ACS contract (not implemented)

Start with read-only correlation. Keep vendor-specific controllers behind their
own management platform, with autonomous operation verified during outages.
Use APIs for bounded reads/reconciliation and asynchronous delivery for events.
Do not share internal databases or expose the trusted admin listener to ACS.

Candidate event envelope fields:

| Field | Purpose |
| --- | --- |
| `schema_version`, `event_type` | Versioned validation and evolution |
| `event_id`, `source_instance_id`, `site_id` | Stable deduplication and site/source identity |
| `occurred_at`, `published_at` | UTC event and delivery timestamps |
| `subject`, `camera_refs`, `source_event_ref` | Stable references mapped to existing video objects |
| `correlation_id`, `causation_id`, optional source sequence | Link related events without relying on arrival order |
| `payload` | Minimal typed domain metadata; no passwords, tokens or video bytes |

Finalize names and schemas jointly with ACS before implementing or committing to
an API version. Persist camera-to-door/zone mapping separately from recording
configuration, with site identity and explicit rename/deletion handling.

Delivery requirements to design and test:

- Stable IDs and idempotent consumers; at-least-once delivery rather than a
  claim of exactly-once processing. Treat source timestamp as event time, not
  delivery order, and define updates/end states for long-lived events.
- Durable delivery state with acknowledgments, bounded batches/timeouts, retry
  backoff/jitter, and an explicit dead-letter/replay process. Existing MQTT
  retained state and QoS alone do not cover application persistence/processing.
- Queue capacity, disk budget, expiry and reconciliation rules must be explicit.
  If a bounded handoff overflows, record the loss and recover from authoritative
  video-event history where possible. Do not block capture/recording to guarantee
  an external notification. Do not silently promise lossless delivery through
  unlimited outages.
- Isolate adapter crashes, networking and resource usage from video workers.
  Expose local queue depth/oldest age, last success, retries, dropped events and
  remote availability using existing diagnostic conventions.
- Use authenticated encrypted service communication, least-privilege grants,
  protected secrets and rotation. Identity federation must define cache expiry,
  revocation, logout and offline fallback before implementation. No shared admin
  account or unvalidated browser-supplied identity headers.
- Video links/exports remain authorized by VMS at access time. ACS events do not
  grant camera access or permanent public URLs. Avoid forwarding unrestricted
  camera credentials, face libraries or full configuration.

## Failure and acceptance matrix

| Failure | Required behavior |
| --- | --- |
| ACS or broker unavailable | VMS records locally; bounded integration backlog/status is visible; reconnect/reconcile without duplicate effects |
| Internet unavailable | Core and provisioned local analytics continue; optional remote features report unavailability without blocking video |
| VMS unavailable | ACS and equipment keep performing their independent functions; video links show unavailable state |
| Adapter crashes | Video services continue; delivery resumes/reconciles after adapter recovery |
| Duplicate/out-of-order event | Correlation state remains consistent using IDs/timestamps/version rules |
| Identity revoked remotely | Enforce the agreed offline validity/revocation policy; independently authorized emergency VMS administration remains possible |
| Camera/NVR path fails | Existing capture recovery and local diagnostics operate; correlate availability without assuming alarm authority |
| Delivery storage full | Enforce the approved budget/overflow policy, report loss, preserve recording I/O and reconcile when possible |

Vendor acceptance must include real equipment, clock drift and Melbourne DST,
network segmentation, TLS/credential failures and controller autonomy. Mocked API
tests are necessary regression coverage but cannot establish hardware behavior.
