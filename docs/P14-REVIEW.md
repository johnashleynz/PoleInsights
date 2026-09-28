# P14 — Compact Detect, complete stress surfaces and structural research

25 September 2026. Local review only; P13 and all earlier release archives preserved.

## Application changes

- Detect reports assessed fibre strength in **MPa and percent of sound wood**. MPa is the existing remaining-fibre factor multiplied by the case's illustrative longitudinal tension reference (normally 35 MPa). This is an explicit reference conversion, not a measured strength, a calibrated knot criterion or UB1000 inference. An empty section reports no fibres rather than zero MPa. The existing percentage and area–strength reduction definitions are unchanged.
- Wave legend, playback, scrubber, signal trace, quality options and simulation basis are in a **collapsed Wave controls and received signal** drawer below the assessment. Playback continues when it is closed; opening it invalidates the paint cache so the trace updates even while paused.
- Removed Enlarge wave view and the repeated assessment height kicker. Tightened the ordinary section's north-marker margin. Detect canvas height follows the circle/device vertical extent, keeping the north marker close to the circle and fitting the entire opposed pair.
- Complete stress circumference is now the default. The previous default removed a 120-degree wedge; Reveal interior remains an explicit option. Both sawn ends now sample the same stress field as the sides. Actual cavities remain absent. No stress values, local FE formulation or capacity calculation were cosmetically modified.
- The production beam, linear soil model and capacity charts remain unchanged. Research results below are separate from displayed pole results.

## Application verification

`node tools/build.mjs` passes **336 checks** (287 existing + 49 P14), TypeScript and Vite. The existing large-bundle advisory remains. `verification/p14.mjs` checks the MPa conversion, unavailable empty sections, circumference ray intersections at twelve bearings, end faces and the nonlinear foundation research described below.

Graphics-enabled browser checks: desktop compact Detect, full stress circle in Pole top, MPa/percentage readout, drawer initially collapsed, opening/closing, pause and time scrub, and near-vertical/horizontal device framing. The user production case is preserved. A separate development case is used for testing. Phone-sized 390 × 844 layout also checked with upright probes and collapsed controls; no browser console errors were captured. Temporary viewport override reset and review tab closed. Both existing production previews refreshed.

## Nonlinear foundation prototype — not connected to production

`src/analysis/research/soilYield.ts` is a coupled two-direction Euler–Bernoulli beam with distributed **elastic-perfectly-plastic soil springs**. Each spring uses a circular yield surface in the horizontal plane; its resistance limit and initial stiffness are the existing illustrative depth-dependent Soft/Medium/Hard parameters. Return mapping updates vector plastic slip; the consistent tangent retains cross-direction terms. Trial slip is committed only after equilibrium. Load increments, reversal and unloading are solved explicitly; unit-load scaling is not used.

The butt remains free. Soil reaction is integrated per unit length using the same quadrature as the tangent. The model reports displacements, reactions, moments, accumulated plastic work and slip. It does not return timber failure load or soil collapse capacity. Failure to find equilibrium rejects the increment; it must not be relabelled a proven collapse load.

A first implementation assembled internal force as K*u and stalled near zero load at 2.32e-6 N equivalent residual; a reversed-load trial stalled at 4.68e-5. Final internal forces are recovered from element curvature to avoid cancellation. The convergence reference is the maximum requested load over the history, preserving a meaningful scale at unloading to zero (1e-8 relative, rotational residuals expressed using a 1 m reference). Separate force and moment checks remain 0.001 N / 0.01 N m. No test tolerance was weakened; the initial stalls are recorded here rather than counted as passing evidence.

Selected benchmark: uniform 320 mm pole, length 11 m, embedment 1.8 m, E=8 GPa, Medium soil. Load path 1 kN → 3 kN → 0 → -3 kN → 0.

- 3 kN tip movement: **322.329 mm**; first unloading residual: **21.532 mm**.
- Final reversed-unload residual: **-21.532 mm**.
- Positive plastic dissipation, force/moment equilibrium, cyclic reversal, radial tangent finite differences, rotation invariance and mesh refinement pass.
- Recorded five-stage study: **222 ms** in Node on this machine; not a p95 or phone guarantee.
- Independent SciPy continuum boundary-value solution uses two joined domains (embedded and above-ground), free end conditions and a monotonic capped soil law. It shares no FE matrices or shape functions. At 3 kN it gives **322.351 mm**, against refined FE **322.358 mm**: **0.00224%** difference, below the predeclared 1% gate.

Reproduce: run `node --experimental-strip-types verification/p14.mjs`, then `python verification/p14/soil_reference.py` with NumPy/SciPy available (used NumPy 2.5.3 / SciPy 1.17.1). Independent output: `verification/results/p14-soil-independent.json`. The standard JS suite does not rerun SciPy automatically. Temporary Python dependencies were installed outside the project and are not packaged.

**Scope limits:** only selected synthetic soil cases are numerically checked. The independent continuum comparison is monotonic and one-directional, not a separate cyclic plasticity validation. No gapping, cyclic degradation, layers, rate dependence, soil-test calibration, large rotations, material damage or ultimate capacity. The research function accepts the pole model geometry, but the evidence here qualifies neither all such inputs nor production integration. Coupling this history-dependent response to load gestures, caches, A/B, capacity search and the current direction-envelope chart still needs a coherent implementation; simply replacing a spring law would leave invalid linear scaling elsewhere.

## Further local-solid boundary evidence

`verification/p14/solid_boundaries.mjs` adds fixed-local-mesh studies for prescribed knots and source-graded heart decay. It preserves original nodes and elements and extends only remote cuts by 0 / 0.3 / 0.6 m. Five fixed nonsingular probes are checked. The gate remains 5%, established before solving.

| Case | Largest 0.3 → 0.6 m extension change | Outcome |
|---|---:|---|
| Prescribed knot fibre field | 0.00944% | Selected boundary check passes |
| Source-graded heart decay | 0.00507% | Selected boundary check passes |

Raw evidence: `verification/results/p14-solid-boundaries.json`. These two checks are additional studies, not included in the 336 standard check count. They complement P09 mesh studies. They do not physically validate knots, qualify every geometry/orientation, establish a failure measure, or justify using local peaks as capacity. Drilling still needs its own fixed-local-mesh boundary study; the flat bore-end edge remains singular.

## Continuing the requested failure programme

The concrete sequence, acceptance gates and required data are in [STRUCTURAL-QUALIFICATION-PROGRAMME.md](STRUCTURAL-QUALIFICATION-PROGRAMME.md). None of splitting, shell instability or nonlinear timber fracture has been silently added as an empirical multiplier. The production app retains its explicit unassessed mechanisms.

## Preservation

Parent Crossarm/Conductors source, existing changes and earlier review archives remain intact. P14 source/build ZIPs are local review packages. No website deployment or external sharing.
