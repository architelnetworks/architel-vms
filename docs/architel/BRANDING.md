# Architel VMS branding and asset handoff

Stage 2, 2026-11-06. Product identity is Architel VMS. The existing theme,
typography, routes, and video UI remain unchanged. The sidebar retains the
original 20 px icons inside 32 px square buttons, with labels beside the buttons
in expanded mode. Desktop expansion is 192 px; collapsed width remains 52 px.
The existing per-user IndexedDB preference mechanism saves
`architel-sidebar-collapsed`, namespaced by signed-in username. Mobile navigation
continues to use the original bottom bar.

## Official artwork to supply

No new artwork has been generated. The shared React `Logo` component currently
renders plain text, either `Architel VMS` or `AV`. Existing upstream favicon/PWA
icons are temporary placeholders. Their original asset license is preserved.
Do not treat those placeholders as approved Architel artwork.

Destination paths below are relative to the repository root. SVG sizes describe
recommended viewBoxes/aspect ratios; they must remain sharp at the rendered size.
Use self-contained SVGs with no external fonts, scripts, or linked resources.

| Exact destination | Purpose | Format and dimensions | Transparency | Reuse |
| --- | --- | --- | --- | --- |
| `web/public/images/branding/logo-horizontal-light.svg` | Main horizontal logo on light surfaces | SVG, about 4:1, recommended viewBox 640 x 160; readable within about 168 x 32 px | Transparent | Expanded sidebar, login, setup, About or loading locations using the shared component |
| `web/public/images/branding/logo-horizontal-dark.svg` | Horizontal logo on dark surfaces | SVG, same viewBox and proportions as light variant | Transparent | Same locations; omit this extra export if the light-surface artwork is equally legible on dark surfaces |
| `web/public/images/branding/logo-compact-light.svg` | Compact mark on light surfaces | SVG, square viewBox, recommended 64 x 64; readable at 32 x 32 px | Transparent | Collapsed sidebar and small shared-logo locations |
| `web/public/images/branding/logo-compact-dark.svg` | Compact mark on dark surfaces | SVG, same square viewBox | Transparent | Same locations; omit if one mark works on both themes |
| `web/public/images/branding/favicon.svg` | Scalable browser icon | SVG, square viewBox, legible at 16 x 16 px | Transparent recommended | Main/login browser tabs and Safari mask link; use a simple silhouette compatible with masking |
| `web/public/images/branding/favicon.ico` | Browser fallback | ICO containing 16, 32, and 48 px square images | Transparent recommended | Main and login HTML |
| `web/public/images/branding/favicon-16x16.png` | Small raster favicon | PNG, exactly 16 x 16 px | Transparent recommended | Main and login HTML |
| `web/public/images/branding/favicon-32x32.png` | Raster favicon | PNG, exactly 32 x 32 px | Transparent recommended | Main and login HTML |
| `web/public/images/apple-touch-icon.png` | Apple home screen icon | PNG, exactly 180 x 180 px | Opaque background; no pre-rounded corners | Main and login HTML; one shared export replaces the previous duplicate |
| `web/public/images/android-chrome-192x192.png` | PWA installation icon | PNG, exactly 192 x 192 px | Transparent or approved opaque background | Web manifest |
| `web/public/images/android-chrome-512x512.png` | Large PWA installation icon | PNG, exactly 512 x 512 px | Transparent or approved opaque background | Web manifest and future install previews |
| `web/public/images/maskable-icon.png` | Maskable PWA and notification icon | PNG, exactly 180 x 180 px, matching the current manifest; keep critical content inside the central safe circle with radius 40% of image width | Opaque full-bleed background | Web manifest and push notifications |
| `web/public/images/maskable-badge.png` | Notification badge and existing small maskable entry | PNG, exactly 96 x 96 px, monochrome mark | Transparent outside mark | Push notifications and existing web manifest entry |

One horizontal master and one compact master may be enough to derive all
exports. There is no need to commission separate login, loading, or splash
artwork: shared branding and PWA icons cover the existing surfaces. Once supplied,
wire approved SVG variants into `web/src/components/Logo.tsx`; keep its plain-text
fallback. No missing-file requests are made for the future logo paths today.

The inherited documentation website also contains assets at
`docs/static/img/branding/logo.svg`, `logo-dark.svg`, and `favicon.ico`. If using
artwork there, reuse the approved horizontal variants and ICO by copying them
to those destinations, rather than requesting separate designs. The documentation
navbar currently uses its Architel VMS text title. The inherited
`docs/static/img/branding/frigate.png` and its license remain historical upstream
assets, not the application logo. Legacy unreferenced application exports
`favicon.png` and `mstile-150x150.png` were removed; no Windows tile export is
required by the current templates.

## Identity changes and compatibility

HTML/application metadata, route titles, first-run/login wording, restart/error
messages, configuration display descriptions, test notifications, web manifest,
package names/lockfiles, development workspace title, Docker image metadata,
README introductions, and maintained user-guide prose identify Architel VMS.
English configuration translations are regenerated from Pydantic descriptions.
All locale string values were scanned; translated sentences keep their language
and substitute the product name without changing translation keys.

The following Frigate references are intentional:

- `frigate` Python modules/imports, TypeScript types, API paths/config keys,
  database/media paths, service/process names, image targets/tags, environment
  variables, saved settings export formats, cookies and preference keys remain
  compatibility identifiers. Existing theme/language preferences are preserved.
- Frigate+ is an independent optional service, not an Architel service. Its
  settings, URLs, model references, and acknowledgments retain its name.
- Upstream documentation/GitHub links are labeled as upstream. Version-check
  notices still describe the upstream Frigate release source rather than
  misrepresenting an upstream release as a new Architel VMS release.
- Copyright, MIT license, trademark policy, asset licenses, upstream screenshots,
  archived version headings/anchors, integration protocols and inherited engine
  development documentation retain their original references. Documentation-site
  chat still uses the upstream Frigate support service and is not presented as
  Architel support. Replacing that external documentation service is outside this
  UI-only stage.
- Original favicon/PWA graphics remain temporary placeholders pending the
  official files above. Replacing the raster/icon files at these paths needs no
  API, schema, or deployment-path change.

## Verification

Navigation tests cover original icon button dimensions, visible labels, selected
route, content offset, collapse/expand, saved preference after reload, tooltips,
mobile navigation, product titles, and manifest/icon availability. Existing
navigation, role, and login tests remain the regression foundation. Build, lint,
i18n, asset validation and test results must be reported from the actual run;
this document does not imply that hardware or recording behavior was retested.

Stage 2 results (2026-11-06): production frontend build including TypeScript,
ESLint/E2E spec lint, and i18n extraction CI checks passed. The affected browser
suite passed 195 tests, with 37 intentional platform-specific skips, using the
installed Google Chrome through a temporary Playwright configuration. It covered
navigation, auth, logs, setup account/hardware, command menu, error boundaries,
and system health. A notification regression test passed, and the generated API
auth spec check passed. Locale JSON, package/lockfile names, local documentation
links and icon/manifest paths were validated. Existing large-bundle warnings
remain. The documentation website build and full backend suite were not run.
Official artwork remains pending.
