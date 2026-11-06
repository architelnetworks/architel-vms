# Architel VMS decision register

Updated 2026-11-06. Accepted product constraints below come from the project brief.
Proposals and unresolved choices are not represented as implemented features.
See [Architecture](ARCHITECTURE.md) and [Roadmap](ROADMAP.md).

## Accepted constraints

| ID | Decision | Consequence |
| --- | --- | --- |
| A01 | Retain Frigate as the video foundation | Extend existing recording, streaming, detection, search, APIs and UI; avoid parallel implementations |
| A02 | Separate VMS and ACS ownership | VMS owns video and video-specific events; ACS owns access identities, permissions, credentials, doors, security alarms and related audit history. VMS enforces local video access and records its own application actions |
| A03 | Independent local operation | Ubuntu deployment must record and support local administration without internet or ACS. Hardware controllers continue autonomous access/intrusion functions |
| A04 | Optional API/event integration | No shared ACS database, synchronous ACS calls in recording paths, or essential cloud dependency |
| A05 | No per-camera, per-user or recurring software fees | Essential deployment uses locally provisioned features/models; optional subscription/cloud paths cannot become required |
| A06 | Standards and upstream compatibility | Prefer ONVIF/RTSP and existing Frigate integrations; isolate Architel additions and document necessary core changes |
| A07 | Reusable site configuration | Pride Centre is the first deployment, not hardcoded product behavior; site mappings, names and credentials remain configuration |

## Proposed implementation direction

| ID | Proposal | Reason and condition |
| --- | --- | --- |
| P01 | Modular VMS application with isolated optional integration worker | Preserve the working process architecture and minimize operational complexity; choose sidecar/process placement when the delivery contract is known |
| P02 | Reuse YAML/Pydantic configuration and SQLite initially | Avoid a second source of camera/user truth. Benchmark before changing databases; new durable integration state may need its own bounded store |
| P03 | Map external stable IDs to current camera names | Avoid immediate migration of recording, role and event references. Define rename/deletion behavior before adding UUID-backed inventory |
| P04 | Durable at-least-once integration delivery with deduplication | Existing MQTT/WS reconnect behavior is not an application delivery guarantee. Final queue bounds, persistence and reconciliation depend on event criticality |

## Decisions requiring attention

| ID | Question and repository evidence | Required decision gate |
| --- | --- | --- |
| O01 | Python guidance says 3.13+, while Docker/CI/Ruff use 3.11; web build uses Node 20 while local setup used 26 | Choose supported runtime/toolchain versions, test locked dependencies/builds, then align instructions and automation together. Do not silently change either baseline |
| O02 | Local dev proxies anonymous-admin port 5000; native auth/TLS listener exists | Define authenticated dev and Ubuntu production entry points, TLS trust/renewal, rate limits, protected service ports and emergency administration before claiming auth acceptance |
| O03 | ACS owns identity/access permissions, while VMS already has local users and camera roles | Define authoritative external identities, VMS application grants, offline authorization validity/revocation and independent emergency access; reuse existing enforcement rather than duplicate identity stores |
| O04 | Approximately 78 cameras, no verified stream/hardware/storage inventory | Approve retention, concurrency, bandwidth, failure/recovery objectives and server sizing from representative pilot/load evidence |
| O05 | Storage pressure can delete retained footage | Agree whether evidence needs protected copies/holds, capacity reserves and immutable manifests; define behavior when preservation conflicts with continued recording |
| O06 | Existing users/camera roles and export cases, no comprehensive action ledger found | Agree capability granularity and audit scope/retention/access, including export/download, deletion, PTZ and configuration changes |
| O07 | Optional analytics can download models or call remote services | Select launch features, preload exact assets, record model provenance/usage terms, decide local GenAI requirements and test offline cold starts |
| O08 | No vendor/site integration contract available | Obtain authorized ACS and equipment interface specifications; choose transport, service authentication, ordering/delivery, replay window and credential rotation. Do not assume Protege/Hikvision APIs |
| O09 | Existing backup/migration primitives, no complete production recovery package | Approve local backup destinations, restore objectives, release provenance, upgrade/rollback compatibility, disk failure policy and monitoring ownership |
| O10 | Face/LPR/audio analytics are present | Obtain site approval for which features are enabled and how data is handled before rollout; this audit does not establish policy or legal suitability |

## Change discipline

2026-11-06, Stage 2: use Architel VMS for product display identity, preserving
technical Frigate identifiers and third-party brands. Reuse the existing desktop
navigation and per-user preference store; preserve the original icon buttons
with adjacent labels and a 52 px collapsed mode. Use text placeholders until
official assets arrive. See [Branding](BRANDING.md). No recording or application
security behavior is changed by this decision.

For a resolved decision, record date, rationale, alternatives, affected modules,
migration/compatibility effects, and acceptance evidence here. Product constraints
remain in force until explicitly revised. A feature's presence in source does not
make its production deployment or its operational policy accepted.
