# P25 — Restored inspection phones

27 September 2026. Local review only; no deployment or GitHub writes.

## Delivered

- Safe2Climb and Axonic Analyser open inside the restored phone wrappers in both native popups and the embedded fallback. The presentation uses the owner's requested **Samsung Galaxy S21 Ultra** name, rounded handset/screen corners, metallic bezel, camera hole, side buttons, Android status bar and navigation gesture bar.
- Retains the reviewed 430 × 910 handset / 412 × 892 screen geometry and responsive fitting. The embedded panel remains minimisable; the app scrolls inside its screen. Pole Lab owns the launch/close controls, with no duplicate phone pop-out command.
- Removed the added “Pole Lab workflow demo · preset outcomes, not results calculated from this pole.” banner completely. This owner request supersedes P23's banner requirement. Native mockup prototype/about wording remains.
- A validated child-to-phone-to-lab relay forwards acquisition events and launch metadata. Both boundaries check the exact origin, window identity, session token, app identity and message shape. No wildcard target origins. The relay forwards only acquisition fields and pauses on phone exit; existing lab heartbeats/timeouts and close monitoring remain.
- Preserves one active app, pole metadata prefill, valid scan-start height sync, actual capture start/stop, restoration of local Play/Pause, Detect/A–B cleanup, isolated session storage and the P24 signal envelope. Fixture outputs never become lab calculations or live UB1000 inference.

## Verification

- TypeScript and Vite production build pass. Existing large-chunk advisory remains.
- `node --experimental-strip-types verification/p23.mjs`: **64 checks pass**, including banner absence, acquisition lifecycle, exact target origin, storage isolation and bundle imports.
- `node --experimental-strip-types verification/p24.mjs`: **16 signal-display checks pass**.
- `node --experimental-strip-types verification/p25.mjs`: **92 checks pass**. Exercises the actual bridge through the new wrapper for both apps and both host arrangements, rejects wrong origin/source/token/app/type/field values, checks metadata, scan/retest/heartbeat/exit state and responsive fit at four sizes.
- Browser at production port 5191: both popup handshakes reached Ready. Both embedded phones were visually inspected with no added banner; Samsung frame chrome is present. Checked desktop and 390 × 844 viewport, plus normal in-app-browser sizing; viewport override reset afterwards.
- Safe2Climb capture at 600 mm moved Detect to 0.60 m, started animation and paused on completion. Minimise preserved the session.
- Axonic capture at 700 mm moved Detect to 0.70 m; the 15-second capture drove playback and paused on completion. Closing restored a previously playing state. A separate close during capture restored a prior manual pause. Minimise/restore worked at narrow width.
- P24 graph rendered the 700 mm result; its playhead visibly/DOM-observably moved with ordinary playback (x coordinate changed from 458.55 to 177.51 in sampled frames). Existing retained-result labels appeared during the height change.
- Switching apps left one active session; leaving Detect and switching A to B removed the previous session. Browser testing restored pole A, single-pole mode and the initial 0.30 m height.

Native popup contents/OS close controls are not exposed by this browser automation surface. Popup connectivity was verified from the lab; capture interaction used the identical embedded wrapper. Forced popup-block permission settings and physical Samsung hardware were not tested. These are local browser checks, not production-host/device certification.

## Reproduction and preservation

Run `python tools/vendor_mockups.py <original-Mockup-folder>` to reproduce the phone and app copies; source hashes are in `verification/results/p25-mockup-sources.json`. The original mockup projects are read-only references. The vendor script retains service-worker removal, separate storage and existing scan hooks.

Run the three targeted verification scripts above, then `node node_modules/typescript/bin/tsc --project tsconfig.json` and `node node_modules/vite/bin/vite.js build`. The usual `node tools/build.mjs` includes P25 for future full builds. This UI increment did not repeat unchanged FE studies.

Package with `python tools/package_review.py P25`. P23/P24 archive hashes are preserved in `verification/results/p25-preserved-archives.json`; the preservation report compares source/public files against P24 and checks the earlier archives and original source hashes. The structural/acoustic solvers, P24 chart implementation and five videos are unchanged. Parent Crossarm/Conductors projects were not edited.

Existing engineering, acoustic calibration and manufacturer-inference limits remain unchanged. No live device integration, new assessment thresholds or real climbing clearance is introduced.
