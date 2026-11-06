# Architel VMS implementation roadmap

Status: proposed delivery plan following the 2026-11-06 repository audit.
Existing features and evidence are in [Architecture](ARCHITECTURE.md).
Dependencies below are gates, not calendar commitments. No stage is claimed
complete merely because corresponding source code exists.

2026-11-06 product stage update: Stage 2 branding and desktop sidebar work is
implemented; see [Branding](BRANDING.md). This UI delivery does not mark the
authenticated deployment, site pilot, capacity, or production acceptance gates
below complete.

| Order | Stage | Dependencies | Deliverable and acceptance gate |
| --- | --- | --- | --- |
| 1 | Reproducible development and authenticated baseline | Audit | Document and test local users/admin/viewer/restricted-camera sessions through the authenticated listener; preserve a separate explicit internal-port development mode. Resolve Python/Node baseline with build/test evidence. One known-good build and recovery path |
| 2 | Site inventory and representative camera pilot | 1 and authorized site access | Inventory camera model/firmware/IP/codec/bitrate/ONVIF support, NVR-private networking and stream limits. Reuse camera wizard/probe/clone for a small representative set. Verify direct RTSP and ONVIF, audio/PTZ where supported, restart/reconnect, record/play/export |
| 3 | Ubuntu deployment and offline packaging | 1, pilot hardware information | Versioned final image, authenticated TLS entry, protected internal ports, explicit volumes/permissions/hardware access, local time service, model asset inventory and offline install/restore instructions. Cold start and enabled features work with internet blocked |
| 4 | Capacity and recording reliability | 2, 3, approved retention targets | Benchmark staged camera counts up to 78, operator concurrency, decode/inference, database/storage latency, network and main/sub recording. Exercise disk pressure, camera/network loss, process failure and server restart. Publish hardware/storage sizing with headroom and measured recording gaps |
| 5 | Large-site administration and operator workflows | 2, findings from 4 | Extend existing inventory/settings/group/layout tools. Add bulk import or discovery only where pilot evidence justifies it. Provide preview/validation, bounded probes, per-device results and recovery; reuse config APIs. Validate review, playback, gaps, timezone/DST and exports with operators |
| 6 | VMS audit and evidence requirements | 1, 3, stakeholder decisions | Define capabilities and audit coverage for config, accounts, exports, deletion and retention. Extend existing cases/jobs/retain behavior with approved evidence preservation and integrity requirements. Test authorization, disk-pressure behavior, audit access and recovery |
| 7 | Optional ACS integration | 3, 6, agreed API/identity contracts | Versioned events/mappings and isolated delivery adapter. Durable bounded retry/reconciliation and local status UI. Verify duplicate/out-of-order delivery, outages, revocation and independent VMS administration; no recording dependency |
| 8 | Production acceptance and staged cutover | 4, 5, 6; 7 only if required at launch | Soak test, restore exercise, support runbooks, upgrade/rollback rehearsal and operator sign-off. Keep existing NVR recording during pilot and migrate in controlled groups; no destructive NVR cutover without a reviewed migration plan |

## Next practical implementation stage

Start stage 1 with a small change that makes authenticated development explicit.
The current localhost Vite setup proxies the trusted internal port, which is
appropriate for isolated UI work but hides the login/permission behavior we need
to validate. Reuse native users, the account wizard, JWT handling, TLS, and
existing auth tests. Add a repeatable authenticated test path without replacing
auth or requiring ACS, and verify admin login/password change, viewer denial,
restricted camera media/WS access, logout and session invalidation.

Before broad onboarding, gather a representative camera sample and requirements:
continuous versus event recording, days retained per stream, expected simultaneous
operators, useful live layouts, export frequency, and acceptable outage/recovery
targets. No camera credentials belong in this documentation or test fixtures.

## Measurement and acceptance plan

- Measure aggregate and per-camera bitrate, recording write rate, free-space
  horizon, capture/dropped frames, FFmpeg reconnects, detector latency, CPU/GPU/RAM,
  shared memory, DB response latency, browser decoder load, export queue pressure,
  and playback startup/seek behavior. Record baseline and test conditions.
- Use measured rates for sizing. As arithmetic only, 78 streams at 4 Mb/s would
  be 312 Mb/s and about 3.37 TB/day of decimal video payload before filesystem,
  audio, sub-stream, redundancy, and spare-capacity allowances. This is not a
  site measurement or a hardware recommendation.
- Agree numerical pass/fail thresholds for recording gaps, retention, search/
  playback latency, outage recovery, data-loss tolerance, and concurrent users
  before load tests. Do not invent thresholds after seeing results.
- Test camera disconnects, broker/ACS/internet loss, missing model assets,
  storage full/missing/read-only, failed workers, host reboot, and backup restore.
  Verify that integration failures do not propagate into recording.
- Mocked Playwright tests remain useful for UI regression; add real media and
  Ubuntu hardware integration checks for capabilities mocks cannot establish.

## Deferred until justified

Do not begin by replacing SQLite, FFmpeg, go2rtc, the UI framework, or Frigate's
record/review pipelines. Consider DB changes, multi-node recording, HA, separate
application services, or a synchronized full-video playback wall only after
requirements and measured limits demonstrate a need. No cloud control plane is
required for the initial deployment.

All stages maintain [Decisions](DECISIONS.md) and [Integrations](INTEGRATIONS.md),
add focused regression coverage for implementation changes, and preserve upstream
mergeability. An ACS integration can ship later without delaying a standalone
video release if it is not a launch acceptance requirement.
