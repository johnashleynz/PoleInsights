# P13 — Detect: calculated transverse wave animation

25 September 2026. Local educational review; no deployment.

## Delivered

The visible Test tab is now Detect. Its section display is a repeating calculated wave field with the existing scaled UB1000 pair, the actual current defect geometry and a received-displacement trace. Compression and shear components, free-edge reflections, scattering and material absorption arise from the numerical model. Changing inspection height, geometry or orientation starts a new calculation. The strength assessment below remains the separately labelled P12 placeholder and does not pretend to invert the simulated signal.

Controls include play/pause, replay, a time scrubber, 1×/2×/4× playback, Auto/Fine detail, defect outlines, a sound-reference trace and an enlarged view. Devices can be rotated directly in the wave view; calculation starts on release. The main-view pair and section-height handle still move the inspection plane. Scrolling the wave section moves height. Keyboard arrows move the height or orientation. The previous completed field is retained while calculating and explicitly identified; unsupported contact over absent timber is reported rather than silently moving the source.

The attached GIFs were inspected with Pillow: both are GIF89a, 859 × 644 pixels, **one frame only**, no frame duration and no loop metadata. The owner authorised proceeding without their animated content. Copies are preserved in `docs/p13-reference`. The default cycle is four seconds of playback plus a brief end hold, labelled 2× relative to an eight-second teaching cycle. This does not claim to match the unavailable GIF timing. Physical microseconds and playback seconds remain separate.

## Numerical model and assumptions

`elasticWave.ts` is a vector, central-force elastic lattice with axial and diagonal bonds. A 2:1 axial/diagonal stiffness ratio gives isotropic long-wave behaviour with lambda = mu and compression/shear speed ratio sqrt(3). Each bond applies equal and opposite forces. Mass is lumped using density and cell area; interfaces use harmonic bond stiffness. Missing timber removes nodes/bonds, including bonds crossing a void midpoint. Missing bonds approximate traction-free outer/cavity boundaries on the grid. There is no periodic wrap in the pole simulation. Integration uses staggered velocity/displacement updates with a conservative stiffness-based time step; split local viscous drag dissipates energy.

Illustrative acoustic properties are deliberately separate from structural bending properties: sound density 650 kg/m³, compression speed 1600 m/s, viscous loss rate 1200 s⁻¹. With prescribed decay severity s, density scales by (1 − 0.30s), speed by (1 − 0.60s), and loss adds 32000s² s⁻¹. Knot regions increase density by 10%, speed by 15%, and loss by 1800 s⁻¹. These are **teaching assumptions**, not measured radiata-pine, knot or UB1000 data. Graded decay uses the authoritative spatial severity field. Timber anisotropy, detailed growth-ring scattering, out-of-plane propagation and calibrated frequency-dependent absorption are not resolved.

A finite-width contact applies a Ricker-type normal-force pulse with approximately zero net impulse. The opposite contact records averaged normal displacement. A separate sound-pole solve uses the same geometry, pulse and contact orientation. Pulse frequency is capped at 18 kHz and limited using the slowest sampled shear speed on a common 96-cell reference grid, targeting 16 cells per shear wavelength. This frequency is illustrative and is not a claim about UB1000 operating frequency. Auto uses 96 × 96 cells on narrow/low-core devices and 128 × 128 otherwise; Fine uses 192 × 192. The common pulse remains the same when switching quality. Features below three cells, including thin drill holes, can be under-resolved; drilling warnings are explicit.

The display shows displacement magnitude. Quantisation and a fixed square-root amplitude colour transfer are applied only to cached display frames. The source/reference normalization is held fixed over a sequence; it is not re-normalised at each frame or separately for the defective field. Void pixels carry no wave displacement. The received trace retains signed floating-point values; the sound and defective curves share one vertical scale. Interference may increase a local peak, so a peak ratio is never treated as a strength percentage.

The conceptual reference is [k-Wave's heterogeneous 2D elastic-wave documentation](https://www.k-wave.org/documentation/pstdElastic2D.php). This implementation is a local lattice discretisation, not a port of k-Wave; no direct k-Wave/MATLAB result comparison has been performed.

## Verification and remaining numerical gap

The full build passes **287 numerical/software checks**: the preceding 266 plus 21 P13 checks. The new evidence in `verification/results/p13.json` includes:

- Independent lattice-dispersion comparisons for longitudinal and shear Fourier modes, and their long-wave speed limits.
- Rigid translation, momentum conservation, bounded undamped integration and exact exponential viscous decay for rigid velocity.
- Planar interface displacement reflection and transmission against independent impedance coefficients (R = 1/3, T = 4/3), within declared absolute tolerances 0.035 and 0.06.
- Identical sound/reference traces, evolving finite frames, source wavelength resolution, zero field in cavities, changed cavity/decay signals and explicit under-resolved drilling.
- A 96-to-160 grid study: first arrival using a 5% reference-peak threshold changed from 254.11 to 255.57 microseconds, within the declared 10 microsecond tolerance.

**Full late-waveform convergence has not passed.** The same 96-to-160 study has approximately 0.824 relative full-trace L2 difference. Late phase and amplitude are sensitive to dispersion, stair-stepped curved boundaries and contact discretisation. That diagnostic is retained with `lateWaveformQualified: false`; it is not counted as a passing convergence check. The UI's Simulation basis identifies this limitation. Early-arrival stability does not qualify quantitative attenuation, defect sizing or instrument inference. Further boundary/source refinement and independent elastic reference comparisons are required before those uses.

Node timings for the small verification cases were approximately 0.23 s sound, 0.34 s cavity and 0.40 s decay; these are not device-wide performance guarantees. Calculation is isolated in a cancellable worker, requests are debounced, stale workers are terminated, and a bounded 24 MiB frame cache reuses completed inputs. Hidden or unchanged paused fields skip image painting. Display frames interpolate in time; the solver is not run at playback frame rate.

Browser checks covered initial looping, pausing and scrubbing to 208 microseconds, the enlarged field and trace together, rotating the probe pair with a retained/labelled prior field while recalculating, Auto/Fine switching, and a 390 × 844 phone layout. The live wave field showed scattering around the saved sketch cavity. Browser console errors were checked. Full A/B interaction, physical touchscreen hardware and manufacturer calibration remain unverified in this increment.

## Preservation and reproduction

Use `node tools/build.mjs` for all checks and production bundling; `node --experimental-strip-types verification/p13.mjs` reproduces the new studies. TypeScript and production bundling pass, with the existing size advisory. Case files retain the existing stored `Test` identifier for compatibility and preserve specimen/probe inputs; transient wave playback settings and frame buffers are not exported. P13 source/build archives preserve this review. Prior archives and the parent applications remain unchanged.
