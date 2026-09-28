# P17 — Local stress assessment, yielding ground and narrated videos

26 September 2026. Local review only. P14 and earlier numbered ZIPs remain unchanged.

## P15: local stress assessment

The curved quadratic solid now recovers all six stress tensor components from its solved displacement field and the same spatial constitutive tensor used in assembly. No nodal smoothing or incompatible beam/solid stress addition was introduced. The stress menu includes pole-axis stress, normal stress along the prescribed fibre direction, signed largest-absolute transverse principal stress, and resultant shear traction across the fibre plane. The three new quantities are available only in the supported local solid region; grey means unassessed. The height chart remains a beam quantity and is explicitly identified as such.

An expandable assessment lists the four stress quantities, the largest sampled normal-stress demand and its location. It uses interior element samples, not a claimed converged surface peak. Along-fibre strengths use case inputs; transverse tension/compression references use the existing illustrative 0.05 / 0.25 ratios. Fibre-axis rotation is not followed by a second Hankinson strength reduction. Decay still reduces the prescribed strength reference. No shear-strength criterion has been invented.

**This is preliminary screening, not qualified solid capacity.** Selected mesh and boundary studies in P07/P09/P14 remain useful within their stated limits, but they do not physically validate arbitrary knots, singular drill edges or a new failure measure. Splitting, shell instability, progressive timber failure and measured calibration are still unassessed. These are explicit in the assessment drawer. The local formulation still has its prior supported-geometry restrictions and is one-way; it does not feed stiffness or capacity back into the beam.

P15 verification adds 42 checks: exact six-component curved-element recovery, spatial lookup, traction/principal transformations, rotation invariance, spatial knot material, unavailable beam-only components, and preliminary status. Raw evidence: `verification/results/p15.json`.

## P16: nonlinear ground integration

Setup → Ground → Allow ground yielding enables the previously researched circular elastic-perfectly-plastic spring law. Soft/Medium/Hard retain their existing illustrative stiffness and resistance parameters. Each converged load or direction change is committed as a vector load target. Unload retains plastic slip; Reset ground history starts at zero load. Geometry, material and soil edits clear the old history. Case files carry the history and reproduce the load path. Limit: 64 targets; failed calculations do not commit a new target. Slider and numeric load/direction edits commit on release or completion.

The worker computes the actual load path; it cannot use unit-load scaling. Whole-pole displacement and applied stress maps use one nonlinear beam/soil solution. The local drilling submodel receives those actual boundary kinematics and is not scaled again. Force-driven above-ground local fields retain their valid unit-load basis. Worst-direction ground envelopes are unavailable because an envelope without a defined history would be ambiguous.

Capacity curves and limit loads remain **explicit elastic reference values**. They are not nonlinear collapse predictions. The current demand readout separately gives timber utilisation. Ground-yield depths, plastic slip and residual tip movement are shown when applicable. The model still assumes small displacement and elastic timber. No gapping, soil cyclic degradation, layers, rate dependence, large-rotation failure or site-specific calibration is claimed.

### Short-element numerical correction

A browser regression case with a 12.7 mm drill bore, knot, graded shell rot and sketched cavity exposed cancellation around short beam elements. Its iterative solve initially stalled at approximately 3.35e-5 N, then at 1.34e-4 N after a trial fixed tolerance floor. The final implementation does not retain that arbitrary floor. It evaluates curvature relative to the element chord, rounds coincident node coordinates consistently, and uses a floating-point arithmetic floor of `32 × machine epsilon × max(sum(abs(K_ij u_j)))` alongside the original relative residual criterion. Independent integrated force and moment gates remain **0.001 N and 0.01 N m**.

The same short-span case exposed cancellation in the existing linear reference's assembled `K*d` residual. Linear residual recovery now uses compatible element strains and soil quadrature, with up to four iterative refinement corrections using the unchanged stiffness. The previous 0.001 N nodal gate is retained, and separate integrated force/moment gates were added. This changes numerical evaluation, not material properties or physical stiffness.

P16 adds 22 checks: actual-load response, cyclic unloading and reset, reference-capacity meaning, balance, displacement/stress consistency, history deduplication/replay, geometry invalidation, malformed history rejection, illegal unit scaling, and the mixed-defect short-span regression. That browser case gives about 467 mm tip movement at 3 kN and 15 mm after unloading, with ground yielding from approximately -0.55 to -0.01 m. These values are synthetic demonstrations, not measured pole predictions. The earlier independent SciPy monotonic foundation comparison remains separate evidence; it is not rerun automatically or presented as cyclic physical validation.

## P17: narrated videos

Menu → Videos replaces the old guide entry. Four actual 1280 × 720 MP4 films use the app's own Three.js pole scene, section renderer and calculated Detect animation:

1. Where poles break — about 72 seconds.
2. Decay and pole strength — about 69 seconds.
3. Listening inside a pole — about 81 seconds.
4. Before anyone climbs — about 77 seconds.

The original scripts use New Zealand synthetic narration (`en-NZ-MitchellNeural`). Captions are burned in using returned word timings; optional WebVTT and transcripts are also provided. Chapter buttons seek within the video. The films use prescribed synthetic cases and retain explicit beam, acoustic calibration and climbing-scope limits. They do not claim approved UB1000 strength inference or Safe to Climb rules. No user pole data was sent to the narration service. Visual assets come from this app; the approximate 160 × 60 mm device geometry is not a new dimensional claim.

Authoring sources: `public/videos/storyboard.json`, `public/videos/manifest.json`, `src/lessons/VideoStudio.tsx`, `tools/narrate.py`, `tools/encode_videos.py`. The local development studio waits for completed section/stress/wave calculations before recording each chapter. It uses actual canvas frames with slow camera motion. The recording endpoint is development-only, same-origin localhost, restricted to the sixteen known chapter filenames and bounded to 40 MB; no endpoint is shipped in the built site.

Narration tooling: [edge-tts](https://github.com/rany2/edge-tts), using Microsoft's New Zealand voice. Encoding: imageio-ffmpeg / FFmpeg, H.264 video and AAC narration. Temporary dependencies and raw capture files are excluded from the source ZIP. Finished media play without a speech-service connection. Regeneration requires authoring dependencies; normal app installation does not.

## Validation and release

TypeScript and targeted P15/P16 tests pass. Full regression/build and finished-media/browser checks are recorded below. No deployment has been performed. The build ZIP is for HTTP serving, and the source ZIP contains the editable project, scripts, finished videos and evidence.
## Final numerical and browser checks

The full standard suite passed 398 checks after the ground solver corrections. Two additional actual-load versus unit-field scaling checks then passed in P15, bringing the recorded standard total to **400**. TypeScript and Vite passed. Existing large-bundle advisories remain; no new phone performance guarantee is claimed.

Browser: the mixed-defect yielding case loaded and unloaded successfully; its 15 mm residual survived reload. Changing geometry cleared history. Unsupported multiple-defect solids withheld the detailed result rather than showing a fabricated field. The supported enclosed-hollow example displayed all four recovered component values and the inspect-location button. At 1 kN the sampled shear readout was 0.09 MPa; the normal-stress governing sample was at 2.67 m. Shear is labelled as a magnitude, not tension/compression. These are UI acceptance observations, not physical validation.

An intermediate arithmetic-floor implementation admitted an overloaded research state; the existing P14 overload regression caught it. The final formulation also requires independent integrated force and moment balance **at every increment before plastic slip commits**, and the original overload rejection test passes. No failed numerical trial is counted as passing evidence.

All four finished MP4s decoded successfully: 1280 × 720, 24 fps, H.264 with AAC narration. Durations are 72.44, 69.35, 81.27 and 77.40 seconds. Caption files and chapter timings were checked, and frames from every chapter were visually reviewed. Wave captures preserve the circular section aspect ratio. Media evidence and checksums are in `verification/results/p17-media.json`.

The production preview loaded all four films without media errors. Chapter selection sought to 16.33 seconds and playback advanced normally. Desktop (1280 × 900) and phone (390 × 844) layouts were checked; the desktop player was widened and phone download-link spacing corrected. No browser console errors were reported in the final check. These checks do not establish performance on physical mobile devices. The included local share server passed six HTTP checks, including byte-range seeking, HEAD requests and WebVTT delivery (`verification/results/p17-server.json`).

The protected parent application digest remains `238E244E51FBFB0DDECD994A10CF27CBD878040E1C270A3C75F6F309C3E4F512`; pre-existing Crossarm changes were preserved. Earlier review ZIPs were retained.
