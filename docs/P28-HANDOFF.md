# Carl's P28 Source Handoff

Updated 8 October 2026. Use a full-source snapshot, not an unreviewed overlay onto
Carl's independently edited P26. Baseline: 5c273fe. Current handoff includes local
working source; HANDOFF-MANIFEST.json records parent SHA, baseline, hashes and omissions.

## Contents

Pole-Insights-P28-source-no-media ZIP includes application/domain/analysis/workers,
local server, Pages Functions, scripts/lockfile, tests, documentation, textures,
favicon/logo, mockups and small video metadata/thumbnails. It excludes video/audio
binaries, .git, node_modules, dist, caches, .env.local/.dev.vars, live API payloads
and machine secrets. No prebuilt runtime or Cloudflare settings are bundled.

Reproduce from the repo root with `node tools/package-p28.mjs`. Output is under
ignored handoff/. The manifest lists omitted media by path for restoration.
The script selects tracked source plus explicitly permitted P28 additions, never
arbitrary untracked user files. It scans selected file content for configured local
credential values and aborts on a match, without printing those values.

## Rebuild in a Separate Directory

1. Extract the ZIP into a new P28 directory. Keep Carl's P26 checkout unchanged.
2. Restore the omitted video/audio files from Carl's P26 media at the same relative
   paths. Keep bundled metadata/mockup/texture changes. Do not regenerate videos.
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
- No secrets in browser/ZIP; production Access, AUD and provider account scope.

Automated gates: npm test and full npm run build. Latest test counts/status should
be read from the execution report, not inferred from historical P27 counts. Hosted
OTP/retrieval success was owner-reported; Carl should independently verify his own
scope. Full deployment and local secret-location notes are DEPLOYMENT.md and
../system-integration.md. Global account selection remains P28-TODO-001.
