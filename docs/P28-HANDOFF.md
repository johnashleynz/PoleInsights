# Carl's P28 Source Handoff

Updated 12 October 2026 for the V28.2 source handoff. Use a full-source snapshot,
not an unreviewed overlay onto Carl's independently edited P26. Baseline:
`5c273fe`. Current repository head before this handoff refresh is `60134b1`;
the ZIP generated after check-in records the exact packaged parent SHA, baseline,
file hashes and media omissions in `HANDOFF-MANIFEST.json`.

## Contents

Pole-Insights-P28-source-no-media ZIP includes application/domain/analysis/workers,
local server, Pages Functions, scripts/lockfile, tests, documentation, textures,
favicon/logo, mockups and small video metadata/thumbnails. It excludes video/audio
binaries, .git, node_modules, dist, caches, .env.local/.dev.vars, live API payloads
and machine secrets. No prebuilt runtime or Cloudflare settings are bundled.

The email package also omits `public/video-ui` capture images and the unused
historical `public/textures/endgrain-p03.png`. Current app textures remain intact.
The ZIP is limited to less than 20,000,000 bytes. Windows packaging uses the .NET
ZIP writer and reads every packaged file back to verify its manifest SHA256.

Reproduce from the repo root with `node tools/package-p28.mjs`. Output is under
ignored handoff/. The manifest lists omitted media by path for restoration.
The script selects tracked source plus explicitly permitted P28 additions, never
arbitrary untracked user files. It scans selected file content for configured local
credential values and aborts on a match, without printing those values.

## Orientation for the Next AI Coder

Start in `README.md`, `AGENTS.md`, this handoff, `P28-AS-BUILT-REQUIREMENTS.md`
and `P28-CHANGELOG.md`. For calculations or UB1000/Detect changes, also read
`docs/ENGINEERING-PLAN.md`, `docs/SOURCES-AND-DATA.md`,
`docs/STRUCTURAL-QUALIFICATION-PROGRAMME.md`, `docs/P27-UB1000-GEOMETRY.md` and
the numbered review for the feature being touched. The main app is under `src/`;
Grid Manager/Axonic support is in `src/integrations`, Cloudflare/Vite API code is
in `functions` and `server`, build/package helpers are in `tools`, and regression
evidence is under `verification`.

Important guardrails: keep one authoritative geometry feeding the scene, sections,
beam model and local previews; keep actual Grid Manager readings, simulated Detect
signals and illustrative deconditioning separate; do not infer RSM, Safe-to-Climb
clearance or proprietary UB1000 thresholds; preserve SI internal calculations and
saved-case compatibility; and do not deploy or promote the site without explicit
owner approval. `BUILD_VERSION` is in `src/domain/build.ts` and is bumped only once
per published iteration.

## Rebuild in a Separate Directory

1. Extract the ZIP into a new P28 directory. Keep Carl's P26 checkout unchanged.
2. Restore the omitted video/audio files and `public/video-ui` capture images from
   Carl's P26 media at the same relative paths before running the full build (its
   film checks require the captures). The manifest lists every omitted path.
   `endgrain-p03.png` is historical and unused by the current app. Keep bundled
   metadata/mockup/current texture changes. Do not regenerate videos.
3. Install Node 22.13 or later; run npm ci, npm test and npm run build there.
4. Run npm run dev -- --port 5192 (use another port if occupied), then open the URL.
5. Model-only use needs no credentials. Integrations default off. For authorised
   local API testing create .env.local from .env.example and provision credentials
   privately. Static Vite preview has no integration server.
6. Review requirements/changelog and smoke tests before selectively merging source
   into the maintained project. No promotion/main/DNS change is automatic.

## Review Checklist

- P27 regression features: Imperial, region/classes, adjustable load point,
  below-ground probes, angled drilling, chipping and registered break markers.
- Single Asset ID shared by Axonic/Grid Manager; remembered profile; A/B focus.
- Exact lookup, no-hit error, internal-ID new-tab record link and selected SR.
- Mixed units, raw repeat readings, grouped height-aligned labels and leader links.
- Measured section diameters, coherent estimated ends, (est.) flags and saved-case
  migration/round trip. Review assumed embedment and fitted/class taper limits.
- V28.2 NZ material preset variants: alphabetical country groups, six owner-supplied
  Fb/CV entries, retained E assumption, saved CV and unchanged generic matching.
- Optional AR Deconditioning remains off by default and explicitly uncalibrated;
  NaN/infinite AR stays visible but supplies no degradation.
- No secrets in browser/ZIP; production Access, AUD and provider account scope.

Automated gates: npm test and full npm run build. Latest test counts/status should
be read from the execution report, not inferred from historical P27 counts. Hosted
OTP/retrieval success was owner-reported; Carl should independently verify his own
scope. Full deployment and local secret-location notes are `DEPLOYMENT.md` and
`system-integration.md`. Global account selection remains `P28-TODO-001`.
