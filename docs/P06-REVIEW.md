# P06 — Tapered section, axial load drag and curved-element research

24 September 2026. Local review; no deployment. P01–P05 release archives retained.

## Visible changes

- Section size now follows the real diameter on one fixed physical scale. A projected timber annulus shows the exterior below the cut, back to the butt circumference. This is an orthographic end-on view, with the same geometry and defect definition used by the pole. Probe coordinates retain physical units; the exterior annulus identifies its height and is not presented as a stress result.
- The red load arrow and its fine leader are collinear in the current camera projection. Push/pull changes magnitude; sideways movement changes bearing where the view resolves the horizontal plane. Front elevation preserves bearing for axial movement because depth cannot be determined from that view. Up/down keys adjust 0.1 kN; left/right adjust 5 degrees. Values remain bounded to 0–50 kN.
- During a gesture only the arrow/handle transforms and label change. Completed gestures commit both load and bearing once, preserving A/B links and one Undo entry. Escape, blur and pointer cancellation restore the original state. A 3-pixel axial tolerance avoids accidental bearing recalculation during a straight push/pull.
- Grass has a crisp nominal **1 m diameter** boundary. The photo texture is cropped inside its baked feathering; blade roots stay inside the edge. The existing organic soil fade, 300 mm deep, remains.
- Phone framing leaves room for the top controls and load arrow. Phone A/B comparison shows one pole at full width with explicit A/B buttons.

## Engineering progress: isolated curved T10 research

The application still displays the P05 local solid preview. P06 adds an isolated isoparametric T10 formulation in src/analysis/solid/curved.ts, which is not imported into the app bundle. Geometry, strain gradients, stiffness and recovery all use the same curved mapping, with consistent curved T6 end loading. Shared boundary midnodes are projected onto the prescribed surfaces. It does not apply a stress correction or combine beam and solid stresses.

Basis cross-check: [DefElement degree-2 tetrahedron](https://defelement.org/elements/examples/tetrahedron-lagrange-equispaced-2.html). Node order is adapted to this project's declared edge order. Numerical checks and independent assembly are the evidence for this implementation, not the reference link alone.

A warped-element trial rejected 27-point integration: the stiffness difference against 64 points was 0.0260%, exceeding the 0.01% gate. The research solver now uses 64-point Duffy/Gauss integration and checks it against 125 points. The failed trial remains in verification/results/p06-exploration.json.

### Recorded checks

The existing 102 checks and 17 P06 checks pass (**119 total**). The P06 checks cover fixed section geometry, taper inversion, affine geometry parity, curved affine strain reproduction, quadrature sensitivity, consistent load/moment transfer, equilibrium and energy/work. The eight-sector curved cap has less than 0.1% area error and 0.2% second-moment error.

An independent NumPy implementation reconstructs material stiffness, shape gradients, curved geometry, 125-point element integration, 25-point end-face loads and a dense solve from raw mesh coordinates. It does not reuse TS element matrices. Relative comparisons:

| Quantity | Difference | Gate |
|---|---:|---:|
| Displacement L2 | 1.99e-7 | 1e-4 |
| Stress L2 | 1.01e-5 | 1e-3 |
| Energy | 1.79e-8 | 1e-4 |
| Transferred nodal load L2 | 4.09e-16 | 1e-10 |
| Independent free-force residual | 3.96e-9 N | 1e-4 N |

### Outer-boundary refinement

Same hollow case and mesh levels as P05; only the outer pole boundary is curved here, leaving the cavity faceted to isolate that change. The force-driven boundary assumptions are unchanged.

| Level | Nodes / elements | Energy J | Diagnostic centroid peak MPa | Circular second-moment error | Recorded solve |
|---|---:|---:|---:|---:|---:|
| Initial | 2,650 / 1,584 | 15.379879 | 2.72914 | 0.0311% | 5.80 s |
| Refined | 5,838 / 3,744 | 15.398924 | 2.82345 | 0.00986% | 34.12 s |
| Fine | 16,434 / 10,944 | 15.410760 | 2.89530 | 0.00195% | 132.83 s |

The final energy change is **0.0769%**, passing the 2% gate for this outer-geometry study; P05's corresponding change was 2.79%. The diagnostic centroid peak changes 2.54%, but that is not a qualified physical failure measure. No capacity claim follows from this study. Timing is one local Node run per case, partly concurrent with browser work; it is not browser p95 performance.

A first mesh with both the outside and cavity curved also solves (initial mesh, energy 15.404335 J, 14.50 s). This single solve is not a cavity refinement study or independent verification of that geometry. Jacobian sign is checked at integration sites, vertices and mid-edge sites, not proven positive everywhere.

### Why the curved solver is not live yet

Curved cavity refinement and boundary sensitivity are still required. Production point lookup currently assumes straight tetrahedra; curved recovery needs an inverse-map locator with explicit containment and accuracy checks. The 64-point solver also needs performance work before phone/A/B use. P05 preview labels, illustrative materials and beam-based first-limit estimates remain unchanged. Physical validation, fracture, soil calibration, UB1000 calibration and Safe to Climb decision rules remain open.

## Browser acceptance

Checked in the graphics-enabled in-app browser at 1280×800 and 390×844: fixed-scale section at ground and 6 m (300 to 210 mm), visible taper, crisp grass edge in section detail, collinear load leader, pulling 4.0 to 9.9 kN, pushing 9.9 to 4.4 kN in elevation, independent/linked A/B keyboard load changes and one-step Undo restoring both poles. Phone framing and A/B switching were checked visually. No app warning/error was reported. The automation connection timed out after two keyboard actions; reading the actual page confirmed both actions completed, so they were not repeated. Held-pointer frame timings, explicit cancellation gestures and actual phone hardware are not measured in P06.

## Reproduce

From this project directory:

- node tools/build.mjs — typecheck, 119 checks and production build.
- python verification/p06/reference.py — requires NumPy; independent curved comparison.
- node --experimental-strip-types verification/p06/refinement.mjs — three-level research study and curved cavity attempt; slower, not part of the routine build.

Raw evidence is in verification/results/p06-*.json. The independent reference input is verification/p06/reference-input.json. The parent Crossarm/Conductors applications are preserved.

Next engineering increment: curved-cavity refinement and an independently checked curved point-stress locator, followed by worker performance and supported-scope review before enabling curved results in the app.
