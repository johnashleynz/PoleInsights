# P23 — Detect workflow mockups

27 September 2026. Local review only; no deployment.

## Delivered

- Safe2Climb and Axonic Analyser launchers at the top of Detect's left pane.
- Bundled copies of the owner's existing Axonic and standalone Safe2Climb mockups. No dependency on the separate 4173/4174 servers. Original projects are unchanged.
- Phone-sized popup windows, with an embedded, minimisable fallback when a popup is blocked or cannot connect. **Open here** also switches to the embedded version. One workflow controls playback at a time.
- Opening an app pauses the ultrasound loop. Actual mockup acquisition start restarts the pulse sequence; completion pauses it. Axonic retains its 15-second capture and Safe2Climb its 3-second capture. Waves retain their existing 2× teaching playback speed.
- Closing a window/app or leaving Detect releases control and restores the user's local Play/Pause preference. Changing the active comparison pole closes its previous app. The page also closes its own popup when unloading.
- Launch metadata is prefilled from the selected pole: species, dimensions and scan height. A new scan moves the lab section to that scan's height, when it is within the accessible pole. Unsupported/missing heights pause the animation instead of showing a scan of the wrong section.
- Opening a workflow brings the section pane back to its animation. The embedded window can be minimised without cancelling acquisition.

## Integration boundary

This connects **workflow acquisition state**, not manufacturer inference. The mockups retain their preset engineering results and Safe2Climb scenarios. A visible banner distinguishes those fixtures from Pole Lab results. No strength, capacity or climbing decision flows from a mockup into the lab, and no acoustic-to-strength algorithm or safety threshold has been introduced.

The initial pole metadata is a launch snapshot. Subsequent mockup geometry/species edits do not edit the lab pole. Scan-start height synchronises to the lab; editing metadata after a scan begins does not move the physical probes mid-scan. Existing mockup input limits and workflows remain, including Safe2Climb's 3 m maximum entry height. Open a new app session to prefill changed lab geometry. Each launch starts a fresh workflow demonstration; original standalone records are never read or changed.

Transport uses same-origin postMessage, exact source-window identity, an unpredictable session token, application identity and typed message validation. Heartbeats recover scan state; loss of connection pauses playback. Repeated running heartbeats do not restart the wave. Separate document/run identifiers distinguish retests and page reloads. The simulation still uses its existing worker, cache, pending-state display and fixed signal scale.

Bundled copies use separate session storage. Service-worker registration and the redundant nested phone-preview command are removed from these copies. Maps and demonstration photos remain existing external resources and require connectivity. No original research files, correspondence, PDFs or user records are included.

## Verification

- TypeScript check and Vite production build pass.
- `node --experimental-strip-types verification/p23.mjs`: **60 checks pass**. Covers message validation, popup/frame transport, acquisition start/stop, repeated heartbeats, retest identifiers/heights, page exit, exact target origin, fixture banner, isolated storage, no service-worker registration and all bundled module imports.
- Browser: both existing apps open with the current pole metadata; popup handshake and embedded operation checked. Axonic start sets running, completion pauses; 600 mm entry moves the section to 0.60 m. Safe2Climb acquisition starts and completes correctly. Closing restores ordinary playback; closing during a scan preserves a pre-existing manual pause. The wave canvas was visually checked while running. Mobile and desktop layouts checked.
- Native popup interaction is not exposed by this browser automation surface; its connection was verified from the lab and interactive scan checks used the embedded copy. Explicit native-window OS close is handled by `Window.closed` polling but has not been manually verified on every target browser. Popup-blocked fallback is implemented; browser permission settings were not changed to force a block.
- Existing numerical/acoustic solvers are unchanged; the 549 checks recorded through P22 retain their original scope. This increment ran the integration checks rather than repeating unchanged FE studies. Build still reports its existing large-chunk advisory.
- Parent protected source digest remains `238E244E51FBFB0DDECD994A10CF27CBD878040E1C270A3C75F6F309C3E4F512`.

Original source-file hashes are recorded in `verification/results/p23-mockup-sources.json`. Reproduce the vendor copies with `python tools/vendor_mockups.py <original-Mockup-folder>`, then run `node tools/build.mjs`. For the delivered review, the copies are already present; access to the other project is not required.

## Remaining limits

This is not hardware communication, live Axonic integration, calibrated UB1000 assessment or authorisation to climb. Existing structural, acoustic and material qualification limits remain unchanged. A cold section calculation may still be pending during a short scan; the UI retains the previous field with its existing pending label until the new field is ready. Full production-host popup/CSP behaviour and device testing remain future release work.
