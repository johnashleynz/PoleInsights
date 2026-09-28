# P07 — Live sections, defect following and curved solid preview

24 September 2026. Local review only. P01–P06 archives retained; no deployment.

## Visible behaviour

- Entering the defect editor, selecting a defect or committing a valid shape/extent/condition edit moves the section to that defect's centre, clipped to the pole. Existing A/B section links are respected.
- Dragging the section updates its cut face, diameter and height during the gesture. It does not launch a new structural analysis. Setup/Innerview use an inexpensive lower-resolution paint while moving and refine on release. Escape/cancel restores the committed height.
- Detailed stress sections are sampled in a separate worker. The UI sends at most one paint job at a time, retaining the latest requested height. A section waiting for pixels is neutral and labelled Preparing section; an old height's stresses are not shown as current. A replaced geometry/load/result terminates the owned sampler. This is rendering work on an already solved field, not a new FE solve.
- Grass appears below cuts above ground and is absent at/below ground. It uses the same nominal 1 m diameter and cropped photographic texture as the 3D patch. Ground visibility is shared. The view retains one physical scale across the groundline; a large pole uses the same minimum clearance around the pole as the 3D grass patch.
- Section wheel zoom and +/− keyboard zoom preserve physical coordinate mapping; double-click resets. The cut, taper, butt outline and grass share the same scale. Grass naturally occludes timber exterior below ground while the butt outline remains a reference.

## Curved solid integration

The optional Resolve defect in 3D preview now uses curved T10 elements on both the outer pole and the enclosed rounded cavity/decay interface. The P05 solver remains in source for its historical regression checks. The new field is versioned solid-p07, with its actual mesh size, runtime and basis in the exported result summary.

The formulation remains a one-way force-driven local submodel: one enclosed rounded region above ground, with a two-diameter sound-wood buffer, illustrative orthotropic elasticity and no solid-to-beam stiffness feedback. Knots, multiple regions, surface openings and embedded/groundline solid analysis remain unsupported. Longitudinal stress/utilisation only is shown. Neither beam and solid stresses nor their utilisations are added together. Global movement and the first model limit remain beam-based.

Curved geometry requires new recovery. Each element stores exact quadratic coefficients for coordinates and solved displacements. A Newton inverse map with a residual line search locates the physical point, checks containment, and differentiates the solved displacement there. Bernstein control-hull bounds include curved bulges outside the nodal box. Section pixels, section probes and the 3D internal slices call the same recovery. No nodal stress averaging, invented concentration multiplier or affine recovery of curved geometry is used. Display pixel size does not determine the calculated probe value or a new capacity measure.

Some otherwise valid cases can still produce an invalid curved mesh. Those solves are rejected and the UI identifies the unavailable detailed result, suggests the refined mesh where appropriate, and retains labelled beam results. It never substitutes another defect shape or a cosmetically corrected stress field. A short, relatively wide eccentric hollow was rejected during browser testing; the provided slender enclosed example solved.

## Verification

The existing 119 checks and 12 new checks pass: **131 total**, plus a separate independent NumPy reference comparison. New checks include element-local and spatial curved recovery, control-hull coverage, void/outside handling, exact load scaling, zero load, decay compliance, nonzero decayed-core stresses and rejection of unsupported knots.

The recovery comparison samples two strictly interior points per element of the 432-element reference mesh. The maximum absolute difference between polynomial recovery and direct B-matrix recovery is 0.001785 Pa, below the predeclared 0.02 Pa gate. No sampled point is missed.

### Independent reference

The independent NumPy implementation assembles from raw curved coordinates and reconstructs material, shape gradients, consistent end loading and the solve. It uses 125 volume integration points against the application's 64, and 25 face points against 16. It also compares off-centre point stresses against the new spatial locator.

| Quantity | Relative difference | Gate |
|---|---:|---:|
| Maximum checked point stress | 2.324e-5 | 1e-3 |
| Displacement L2 | 1.980e-6 | 1e-4 |
| Element-centre stress L2 | 2.129e-5 | 1e-3 |
| Strain energy | 3.684e-6 | 1e-4 |
| Consistent nodal load L2 | 1.033e-15 | 1e-10 |
| Independent free-force residual | 4.657e-9 N | 1e-4 N |

These are numerical verification results, not physical pole validation.

### Cavity refinement

The first fully curved study passed energy but failed the 5% stress-point change gate near the cavity ends (about 20% change). Its raw results are retained as p07-refinement-initial.json. Inspection identified that the original cap fan had little radial detail at the rounded tips. P07 adds 2 / 3 / 4 cap rings alongside the three existing refinement levels; P05/P06 meshes retain their original default cap topology.

The final case is the same uniform 300 mm pole, 600 mm long eccentric rounded hollow, 120×140 mm maximum cavity dimensions, 1 kN unit force and 2-diameter buffer used for the earlier studies.

| Level | Nodes / elements | Energy J | Diagnostic centroid peak MPa | Recorded local solve |
|---|---:|---:|---:|---:|
| Initial | 3,130 / 1,872 | 15.405587 | 2.74353 | 4.42 s |
| Refined | 7,630 / 4,896 | 15.416023 | 2.83174 | 12.95 s |
| Fine | 21,618 / 14,400 | 15.420049 | 2.89919 | 47.66 s |

Final energy change: **0.0261%**, against 2%. Five fixed stress probes change by **0.185%, 2.114%, 3.390%, 0.228%, 0.289%**, all below the 5% gate. This passes the selected benchmark's mesh refinement check. It does not qualify arbitrary defect shapes, pointwise maxima or a physical failure criterion. Centroid peaks remain diagnostic, not capacity values.

The first fine-mesh attempt hit JavaScript's function-argument limit in the residual-scale check. The mathematical maximum is now accumulated without spreading the full vectors into a function call. The failed attempt is retained as p07-refinement-cap-first-attempt.json; the resumed fine solve passed the original residual gate. No stiffness or convergence tolerance was changed.

### Boundary sensitivity remains open

Changing the sound-wood buffer from 1 to 2 to 3 diameters also changes the star-shaped mesh. The cap-refined coarse study no longer folds at the one-diameter buffer, but near-end probes still vary substantially: one probe changes from −0.108 to −0.255 to −0.370 MPa. Side probes are much less sensitive. This is not a controlled boundary-only study, so it cannot distinguish boundary effects from remeshing errors. A study retaining local defect resolution while extending the boundary is still required. This is a specific reason to withhold solid-based capacity.

## Responsiveness and browser checks

Graphics-enabled in-app browser, desktop 1280×800 and phone-sized 390×844:

- Changing From height to 2.3 m moved the section to 2.5 m; changing width from 150 to 152 mm brought it back after it had been dragged elsewhere.
- Setup drag painted eight intermediate section frames. A curved-stress drag painted eleven; the observed final main-thread paint was 4.0 ms while detailed pixel sampling ran in the worker. These are observed gestures, not an FPS/p95 guarantee.
- Curved tapered example: 3,130 nodes / 1,872 elements, 3.81 s browser solve, residual 8.6e-10. Changing load from 4.48 to 2 kN retained the completed solid result and resampled the colours. Stress/utilisation switching was checked.
- Wheel/keyboard section zoom, below-ground grass removal and above-ground grass context were checked. Phone layout was inspected. App error/warning logs were empty in the checked successful flow.
- Actual phone hardware, sustained thermal/memory behaviour, large A/B detailed jobs and explicit cancellation gesture timing remain unmeasured.

In the Node refinement study, a 64×64 probe pass took about 19–23 ms after recovery/index preparation. The reference mesh took about 33 ms for 3,096 material probes. These timings are separate runs and do not imply that finer meshes are generally faster; JIT/caching and concurrent browser activity vary.

## Remaining work

Preserve a fixed local defect mesh for boundary extension studies; broaden shape/orientation/taper/decay verification; qualify a meaningful timber failure measure and supported material properties before changing failure estimates. Continue point/section containment and worker performance checks as scope grows. Physical validation, calibrated soil, fracture/splitting, UB1000 calibration and Safe to Climb logic remain open.

## Reproduce

- node tools/build.mjs — typecheck, 131 checks and production build.
- python verification/p07/reference.py — independent reference, requires NumPy.
- node --experimental-strip-types verification/p07/refinement.mjs — three-level and boundary studies.
- The refinement script accepts --resume to retain completed levels after a reported failure; failed raw attempts are preserved separately.

Raw evidence is in verification/results/p07-*.json; the independent input is verification/p07/reference-input.json. Historical review files/releases are retained. The parent Crossarm and Conductors applications are preserved.
